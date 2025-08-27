const express = require('express');
const { body, validationResult } = require('express-validator');
const webpush = require('web-push');
const { getDatastores } = require('../storage/datastores');
const { requireAuth, requireRole } = require('../middleware/auth');
const { notificationLimiter, planBasedLimiter } = require('../middleware/rateLimiter');
const { triggerWebhookEvent } = require('./webhooks');

const router = express.Router();
const DEBUG_PUSH = ['1', 'true', 'on', 'yes'].includes(String(process.env.DEBUG_PUSH || '').toLowerCase());

router.use(requireAuth, requireRole('customer'));

// Get own push settings and subscribers
router.get('/me', async (req, res) => {
  const { customers, pushSettings, subscriptions, notifications, metrics } = getDatastores();
  const customer = await customers.findOne({ userId: req.user.userId });
  if (!customer) return res.status(404).json({ error: 'Customer not found' });
  const settings = await pushSettings.findOne({ customerId: customer._id });
  const count = await subscriptions.count({ customerId: customer._id });
  // Aggregate notification stats (sent/failed); open/click rates are placeholders until tracked
  const notifDocs = await notifications.find({ customerId: customer._id });
  const successTotal = notifDocs.reduce((acc, n) => acc + (Number(n.success) || 0), 0);
  const failTotal = notifDocs.reduce((acc, n) => acc + (Number(n.failed) || 0), 0);
  const totalSends = notifDocs.length;
  const opens = await metrics.count({ customerId: customer._id, type: 'open' });
  const clicks = await metrics.count({ customerId: customer._id, type: 'click' });
  const delivered = successTotal || 0;
  const openRate = delivered > 0 ? Math.round((opens / delivered) * 100) : 0;
  const clickRate = delivered > 0 ? Math.round((clicks / delivered) * 100) : 0;
  res.json({
    customer,
    settings,
    subscriberCount: count,
    notificationStats: { totalSends, sent: successTotal, failed: failTotal, openRate, clickRate }
  });
});

// Update push settings
router.post(
  '/settings',
  body('vapidPublicKey').optional().isString(),
  body('vapidPrivateKey').optional().isString(),
  body('vapidSubject').optional().isString(),
  body('title').optional().isString(),
  body('iconUrl').optional({ nullable: true }).isString(),
  body('badgeUrl').optional({ nullable: true }).isString(),
  body('defaultUrl').optional({ nullable: true }).isString(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { customers, pushSettings } = getDatastores();
    const customer = await customers.findOne({ userId: req.user.userId });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    const existing = await pushSettings.findOne({ customerId: customer._id });
    const doc = { ...existing, ...req.body, customerId: customer._id, updatedAt: new Date().toISOString() };
    if (existing) {
      await pushSettings.update({ _id: existing._id }, doc, { upsert: true });
      res.json(doc);
    } else {
      const inserted = await pushSettings.insert({ ...doc, createdAt: new Date().toISOString() });
      res.json(inserted);
    }
  }
);

// Send a test notification to all subscribers
router.post(
  '/notify',
  notificationLimiter,
  planBasedLimiter,
  body('title').isString(),
  body('body').isString(),
  body('url').optional().isURL(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { customers, subscriptions, pushSettings, notifications } = getDatastores();
    const customer = await customers.findOne({ userId: req.user.userId });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    const settings = await pushSettings.findOne({ customerId: customer._id });
    const vapidPublicKey = settings?.vapidPublicKey || process.env.VAPID_PUBLIC_KEY;
    const vapidPrivateKey = settings?.vapidPrivateKey || process.env.VAPID_PRIVATE_KEY;
    const vapidSubject = settings?.vapidSubject || process.env.VAPID_SUBJECT || 'mailto:admin@example.com';
    if (!vapidPublicKey || !vapidPrivateKey) return res.status(400).json({ error: 'Missing VAPID keys' });
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

    const subs = await subscriptions.find({ customerId: customer._id });
    const cid = customer._id;
    const payload = JSON.stringify({
      title: req.body.title,
      body: req.body.body,
      url: req.body.url,
      track: { // optional; SW may ignore if not present
        openUrl: `/api/metrics/open?cid=${encodeURIComponent(cid)}`,
        clickUrl: `/api/metrics/click?cid=${encodeURIComponent(cid)}`
      }
    });

    if (DEBUG_PUSH) {
      console.log('[push] preparing', {
        customerId: customer._id,
        subscriptions: subs.length,
        vapidSubject,
        vapidPublicKey: vapidPublicKey ? String(vapidPublicKey).slice(0, 8) + '...' : null,
        title: req.body.title,
      });
    }

    const results = await Promise.allSettled(
      subs.map((s) => webpush.sendNotification(s.subscription, payload))
    );

    const ok = results.filter((r) => r.status === 'fulfilled').length;
    const fail = results.length - ok;

    if (DEBUG_PUSH && fail > 0) {
      results.forEach((r, i) => {
        if (r.status === 'rejected') {
          const err = r.reason || {};
          const endpoint = subs[i] && subs[i].subscription ? subs[i].subscription.endpoint : null;
          const statusCode = err.statusCode || err.status || null;
          const name = err.name || null;
          const message = err.message || String(err);
          const body = err.body || null;
          console.error('[push] failed', { endpoint, statusCode, name, message, body });
        }
      });
    }
    const notificationRecord = await notifications.insert({ customerId: customer._id, payload: req.body, sentAt: new Date().toISOString(), success: ok, failed: fail });
    
    // Trigger webhook event
    await triggerWebhookEvent(customer._id, 'notification.sent', {
      notification_id: notificationRecord._id,
      title: req.body.title,
      body: req.body.body,
      url: req.body.url,
      sent: ok,
      failed: fail,
      total_recipients: results.length,
      sent_at: notificationRecord.sentAt
    });
    
    if (DEBUG_PUSH) {
      console.log('[push] summary', { customerId: customer._id, total: results.length, sent: ok, failed: fail });
    }
    res.json({ sent: ok, failed: fail });
  }
);

// Generate and save VAPID keys
router.post('/generate-vapid', async (req, res) => {
  const { customers, pushSettings } = getDatastores();
  const customer = await customers.findOne({ userId: req.user.userId });
  if (!customer) return res.status(404).json({ error: 'Customer not found' });
  const keys = webpush.generateVAPIDKeys();
  const doc = { customerId: customer._id, vapidPublicKey: keys.publicKey, vapidPrivateKey: keys.privateKey, updatedAt: new Date().toISOString() };
  const existing = await pushSettings.findOne({ customerId: customer._id });
  if (existing) await pushSettings.update({ _id: existing._id }, { $set: doc });
  else await pushSettings.insert({ ...doc, createdAt: new Date().toISOString() });
  res.json(keys);
});

// List subscribers
router.get('/subscribers', async (req, res) => {
  const { customers, subscriptions } = getDatastores();
  const customer = await customers.findOne({ userId: req.user.userId });
  if (!customer) return res.status(404).json({ error: 'Customer not found' });
  const subs = await subscriptions.find({ customerId: customer._id }).sort({ createdAt: -1 });
  res.json(subs.map((s) => ({ id: s._id, endpoint: s.subscription?.endpoint, createdAt: s.createdAt })));
});

module.exports = router;


