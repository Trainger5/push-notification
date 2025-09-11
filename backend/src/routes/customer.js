const express = require('express');
const { body, validationResult } = require('express-validator');
const webpush = require('web-push');
const { getDatastores } = require('../storage/datastores');
const { requireAuth, requireRole } = require('../middleware/auth');
const { notificationLimiter, planBasedLimiter } = require('../middleware/rateLimiter');
const { triggerWebhookEvent } = require('./webhooks');

const router = express.Router();
const DEBUG_PUSH = ['1', 'true', 'on', 'yes'].includes(String(process.env.DEBUG_PUSH || 'true').toLowerCase());

router.use(requireAuth, requireRole('customer'));

// Get own push settings and subscribers
router.get('/me', async (req, res) => {
  const { customers, pushSettings, subscriptions, notifications, metrics } = getDatastores();
  const customer = await customers.findOne({ user_id: req.user.user_id });
  if (!customer) return res.status(404).json({ error: 'Customer not found' });
  const settings = await pushSettings.findOne({ customer_id: customer.id });
  const count = await subscriptions.count({ customer_id: customer.id });
  // Aggregate notification stats (sent/failed); open/click rates are placeholders until tracked
  const notifDocs = await notifications.find({ customer_id: customer.id });
  const successTotal = notifDocs.reduce((acc, n) => acc + (Number(n.success) || 0), 0);
  const failTotal = notifDocs.reduce((acc, n) => acc + (Number(n.failed) || 0), 0);
  const totalSends = notifDocs.length;
  const opens = await metrics.count({ customer_id: customer.id, event_type: 'opened' });
  const clicks = await metrics.count({ customer_id: customer.id, event_type: 'clicked' });
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
  body('vapid_public_key').optional().isString(),
  body('vapid_private_key').optional().isString(),
  body('vapidSubject').optional().isString(),
  body('title').optional().isString(),
  body('iconUrl').optional({ nullable: true }).isString(),
  body('badgeUrl').optional({ nullable: true }).isString(),
  body('defaultUrl').optional({ nullable: true }).isString(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { customers, pushSettings } = getDatastores();
    const customer = await customers.findOne({ user_id: req.user.user_id });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    const existing = await pushSettings.findOne({ customer_id: customer.id });
    const doc = { ...existing, ...req.body, customer_id: customer.id, updated_at: new Date().toISOString() };
    if (existing) {
      await pushSettings.update({ id: existing.id }, doc, { upsert: true });
      res.json(doc);
    } else {
      const inserted = await pushSettings.insert({ ...doc, created_at: new Date().toISOString() });
      res.json(inserted);
    }
  }
);

// Fix VAPID mismatch issues by regenerating keys and clearing subscriptions
router.post('/fix-vapid', async (req, res) => {
  const { customers, pushSettings, subscriptions } = getDatastores();
  const customer = await customers.findOne({ user_id: req.user.user_id });
  if (!customer) return res.status(404).json({ error: 'Customer not found' });
  
  try {
    // Clear all existing subscriptions
    const deletedSubs = await subscriptions.remove({ customer_id: customer.id }, { multi: true });
    
    // Generate new VAPID keys
    const keys = webpush.generateVAPIDKeys();
    // Format datetime for MySQL (YYYY-MM-DD HH:MM:SS)
    const mysqlDateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const doc = {
      customer_id: customer.id,
      vapid_public_key: keys.publicKey,
      vapid_private_key: keys.privateKey,
      vapid_subject: 'mailto:admin@localhost',
      default_title: `${customer.name || 'Notifications'}`,
      default_icon_url: null,
      default_badge_url: null,
      default_url: null,
      updated_at: mysqlDateTime
    };
    
    // Update or create settings with new keys
    const existing = await pushSettings.findOne({ customer_id: customer.id });
    if (existing) {
      await pushSettings.update({ id: existing.id }, doc, { upsert: true });
    } else {
      await pushSettings.insert({ ...doc, created_at: mysqlDateTime });
    }
    
    res.json({
      success: true,
      message: 'VAPID keys regenerated and subscriptions cleared',
      deletedSubscriptions: deletedSubs,
      newPublicKey: keys.publicKey,
      instructions: 'Please clear your browser cache/service worker and re-subscribe to push notifications.'
    });
  } catch (error) {
    console.error('Fix VAPID error:', error);
    res.status(500).json({ error: 'Failed to fix VAPID configuration' });
  }
});

// Send a rich notification to all subscribers
router.post(
  '/notify',
  // notificationLimiter, // TODO: Re-enable rate limiting later
  // planBasedLimiter, // TODO: Re-enable rate limiting later
  // Temporarily disable all validation for testing
  (req, res, next) => {
    console.log('🔔 CUSTOMER NOTIFY ROUTE HIT!');
    console.log('Request URL:', req.url);
    console.log('Request method:', req.method);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    next();
  },
  async (req, res) => {
    console.log('Inside async handler');
    const { customers, subscriptions, pushSettings, notifications } = getDatastores();
    const customer = await customers.findOne({ user_id: req.user.user_id });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    const settings = await pushSettings.findOne({ customer_id: customer.id });
    
    // Check if VAPID keys exist
    if (!settings || !settings.vapid_public_key || !settings.vapid_private_key) {
      return res.status(400).json({ 
        error: 'VAPID keys not configured',
        message: 'Push settings not initialized. Please ensure subscriptions are created first.',
        code: 'VAPID_NOT_CONFIGURED'
      });
    }
    
    // Use the settings VAPID keys
    const vapidPublicKey = settings.vapid_public_key;
    const vapidPrivateKey = settings.vapid_private_key;
    const vapidSubject = settings.vapid_subject || settings.vapidSubject || 'mailto:admin@localhost';
    
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

    const subs = await subscriptions.find({ customer_id: customer.id });
    const cid = customer.id;
    
    // Build rich notification payload
    const payload = JSON.stringify({
      title: req.body.title,
      body: req.body.body,
      url: req.body.url,
      image: req.body.image,
      icon: req.body.icon,
      badge: req.body.badge,
      tag: req.body.tag,
      silent: req.body.silent,
      requireInteraction: req.body.requireInteraction,
      renotify: req.body.renotify,
      vibrate: req.body.vibrate,
      dir: req.body.dir || 'auto',
      lang: req.body.lang || 'en-US',
      actions: req.body.actions && Array.isArray(req.body.actions) ? 
        req.body.actions.slice(0, 2).map(action => ({
          action: action.action,
          title: action.title,
          icon: action.icon
        })) : undefined,
      data: req.body.data || {},
      timestamp: new Date().toISOString(),
      track: { // Enhanced tracking for rich notifications
        openUrl: `/api/metrics/open?cid=${encodeURIComponent(cid)}`,
        clickUrl: `/api/metrics/click?cid=${encodeURIComponent(cid)}`,
        dismissUrl: `/api/metrics/dismiss?cid=${encodeURIComponent(cid)}`
      }
    });

    if (DEBUG_PUSH) {
      console.log('[push] preparing', {
        customer_id: customer.id,
        subscriptions: subs.length,
        vapidSubject,
        vapid_public_key: vapidPublicKey ? String(vapidPublicKey).slice(0, 8) + '...' : null,
        title: req.body.title,
      });
    }

    const results = await Promise.allSettled(
      subs.map((s) => {
        // Handle both NeDB and MySQL data structures
        const subscription = s.subscription || {
          endpoint: s.endpoint,
          keys: {
            p256dh: s.p256dh_key || s.p256dh,
            auth: s.auth_key || s.auth
          }
        };
        return webpush.sendNotification(subscription, payload);
      })
    );

    const ok = results.filter((r) => r.status === 'fulfilled').length;
    const fail = results.length - ok;
    
    // Check for VAPID mismatch errors
    let vapidMismatchDetected = false;
    
    if (DEBUG_PUSH) {
      results.forEach((r, i) => {
        const sub = subs[i];
        const endpoint = (sub && sub.subscription) ? sub.subscription.endpoint : (sub ? sub.endpoint : null);
        
        if (r.status === 'rejected') {
          const err = r.reason || {};
          const statusCode = err.statusCode || err.status || null;
          const name = err.name || null;
          const message = err.message || String(err);
          const body = err.body || null;
          
          // Detect VAPID mismatch error
          if (statusCode === 403 && body && body.includes('VAPID credentials')) {
            vapidMismatchDetected = true;
          }
          
          console.error('[push] FAILED', { endpoint: endpoint?.substring(0, 50) + '...', statusCode, name, message, body });
        } else {
          console.log('[push] SUCCESS', { endpoint: endpoint?.substring(0, 50) + '...' });
        }
      });
    }
    
    // If VAPID mismatch detected, automatically fix it
    if (vapidMismatchDetected) {
      console.log('[VAPID FIX] Mismatch detected, automatically fixing...');
      
      try {
        // Clear all existing subscriptions with wrong keys
        const deletedCount = await subscriptions.remove({ customer_id: customer.id }, { multi: true });
        console.log(`[VAPID FIX] Cleared ${deletedCount} old subscriptions`);
        
        // Generate new VAPID keys
        const keys = webpush.generateVAPIDKeys();
        // Format datetime for MySQL (YYYY-MM-DD HH:MM:SS)
        const mysqlDateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const newSettings = {
          customer_id: customer.id,
          vapid_public_key: keys.publicKey,
          vapid_private_key: keys.privateKey,
          vapid_subject: 'mailto:admin@localhost',
          default_title: settings?.default_title || `${customer.name || 'Notifications'}`,
          default_icon_url: settings?.default_icon_url || null,
          default_badge_url: settings?.default_badge_url || null,
          default_url: settings?.default_url || null,
          updated_at: mysqlDateTime
        };
        
        // Update settings with new keys
        if (settings) {
          await pushSettings.update({ id: settings.id }, newSettings, { upsert: true });
        } else {
          await pushSettings.insert({ ...newSettings, created_at: mysqlDateTime });
        }
        
        console.log('[VAPID FIX] Generated new VAPID keys');
        
        // Return response indicating the fix
        return res.status(200).json({
          success: false,
          code: 'VAPID_FIXED',
          message: 'VAPID key mismatch detected and automatically fixed',
          action: 'All subscriptions cleared and new VAPID keys generated',
          instructions: 'Please refresh your browser and re-subscribe to push notifications',
          newPublicKey: keys.publicKey
        });
      } catch (fixError) {
        console.error('[VAPID FIX] Failed to auto-fix:', fixError);
        return res.status(500).json({
          error: 'VAPID fix failed',
          message: 'Detected VAPID mismatch but could not automatically fix it',
          code: 'VAPID_FIX_FAILED'
        });
      }
    }
    const notificationRecord = await notifications.insert({ 
      customer_id: customer.id, 
      title: req.body.title,
      body: req.body.body,
      url: req.body.url || null,
      icon_url: req.body.icon || null,
      image_url: req.body.image || null,
      payload: req.body, 
      sentAt: new Date(), 
      success: ok, 
      failed: fail,
      status: 'sent',
      sent_count: ok,
      failed_count: fail,
      target_type: 'all'
    });
    
    // Trigger webhook event
    await triggerWebhookEvent(customer.id, 'notification.sent', {
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
      console.log('[push] summary', { customer_id: customer.id, total: results.length, sent: ok, failed: fail });
    }
    res.json({ sent: ok, failed: fail });
  }
);

// Generate and save VAPID keys
router.post('/generate-vapid', async (req, res) => {
  const { customers, pushSettings } = getDatastores();
  const customer = await customers.findOne({ user_id: req.user.user_id });
  if (!customer) return res.status(404).json({ error: 'Customer not found' });
  const keys = webpush.generateVAPIDKeys();
  const doc = { customer_id: customer.id, vapid_public_key: keys.publicKey, vapid_private_key: keys.privateKey, updated_at: new Date().toISOString() };
  const existing = await pushSettings.findOne({ customer_id: customer.id });
  if (existing) await pushSettings.update({ id: existing.id }, { $set: doc });
  else await pushSettings.insert({ ...doc, created_at: new Date().toISOString() });
  res.json(keys);
});

// Get recent notifications for customer
router.get('/notifications', async (req, res) => {
  const { customers, notifications } = getDatastores();
  const customer = await customers.findOne({ user_id: req.user.user_id });
  if (!customer) return res.status(404).json({ error: 'Customer not found' });
  
  const limit = parseInt(req.query.limit) || 10;
  const skip = parseInt(req.query.skip) || 0;
  
  const recentNotifications = await notifications.find({ customer_id: customer.id }, { 
    sort: { sent_at: -1 }, 
    limit: limit, 
    skip: skip 
  });
  
  res.json(recentNotifications);
});

// List subscribers with detailed information
router.get('/subscribers', async (req, res) => {
  const { customers, subscriptions } = getDatastores();
  const customer = await customers.findOne({ user_id: req.user.user_id });
  if (!customer) return res.status(404).json({ error: 'Customer not found' });
  const subs = await subscriptions.find({ customer_id: customer.id }, { sort: { subscribed_at: -1 } });
  
  // Return detailed subscriber information including location, device, and tenant
  res.json(subs.map((s) => ({ 
    id: s._id, 
    endpoint: s.subscription?.endpoint,
    country: s.country,
    city: s.city,
    region: s.region,
    timezone: s.timezone,
    browser: s.browser || 'Unknown',
    os: s.os || 'Unknown',
    device: s.device || 'Unknown',
    tenant: customer.name, // Use customer name as tenant identifier
    tags: s.tags || [],
    segments: s.segments || [],
    engagementScore: s.engagementScore || 0,
    lastActive: s.lastActive,
    created_at: s.subscribed_at
  })));
});

module.exports = router;


