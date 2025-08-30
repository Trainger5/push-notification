const express = require('express');
const { body, validationResult } = require('express-validator');
const webpush = require('web-push');
const { getDatastores } = require('../storage/datastores');
const crypto = require('crypto');
const geoip = require('geoip-lite');
const { subscriptionLimiter } = require('../middleware/rateLimiter');
const { triggerWebhookEvent } = require('./webhooks');

const router = express.Router();

// Public SDK endpoints

// Verify API key and get site config (e.g., VAPID public key)
router.get('/config', async (req, res) => {
  const apiKey = req.query.apiKey;
  if (!apiKey) return res.status(400).json({ error: 'Missing apiKey' });
  const { customers, pushSettings } = getDatastores();
  const customer = await customers.findOne({ apiKey, active: true });
  if (!customer) return res.status(404).json({ error: 'Invalid apiKey' });
  let settings = await pushSettings.findOne({ customerId: customer._id });
  if (!settings || !settings.vapidPublicKey || !settings.vapidPrivateKey) {
    const keys = webpush.generateVAPIDKeys();
    const doc = {
      customerId: customer._id,
      vapidPublicKey: keys.publicKey,
      vapidPrivateKey: keys.privateKey,
      vapidSubject: settings?.vapidSubject || process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
      title: settings?.title || `${customer.name || 'Notifications'}`,
      iconUrl: settings?.iconUrl || null,
      badgeUrl: settings?.badgeUrl || null,
      defaultUrl: settings?.defaultUrl || null,
      updatedAt: new Date().toISOString()
    };
    if (settings) {
      await pushSettings.update({ _id: settings._id }, { $set: doc });
      settings = { ...settings, ...doc };
    } else {
      settings = await pushSettings.insert({ ...doc, createdAt: new Date().toISOString() });
    }
  }
  res.json({ vapidPublicKey: settings?.vapidPublicKey || process.env.VAPID_PUBLIC_KEY || null, title: settings?.title || null, iconUrl: settings?.iconUrl || null, badgeUrl: settings?.badgeUrl || null, defaultUrl: settings?.defaultUrl || null });
});

// Save a new subscription from the client SDK
router.post(
  '/subscribe',
  // subscriptionLimiter, // TODO: Re-enable rate limiting later
  body('apiKey').isString(),
  body('subscription').isObject(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { apiKey, subscription } = req.body;
    const { customers, subscriptions } = getDatastores();
    const customer = await customers.findOne({ apiKey, active: true });
    if (!customer) return res.status(404).json({ error: 'Invalid apiKey' });
    const exists = await subscriptions.findOne({ customerId: customer._id, 'subscription.endpoint': subscription.endpoint });
    if (exists) return res.json({ status: 'exists' });
    
    // Enhanced subscription document with metadata for analytics and segmentation
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress;
    const geo = geoip.lookup(ip);
    const userAgent = req.headers['user-agent'] || '';
    
    // Parse user agent for device/browser info
    const deviceInfo = {
      browser: 'Unknown',
      os: 'Unknown',
      device: 'Unknown'
    };
    
    if (userAgent) {
      if (userAgent.includes('Chrome')) deviceInfo.browser = 'Chrome';
      else if (userAgent.includes('Firefox')) deviceInfo.browser = 'Firefox';
      else if (userAgent.includes('Safari')) deviceInfo.browser = 'Safari';
      else if (userAgent.includes('Edge')) deviceInfo.browser = 'Edge';
      
      if (userAgent.includes('Windows')) deviceInfo.os = 'Windows';
      else if (userAgent.includes('Mac')) deviceInfo.os = 'macOS';
      else if (userAgent.includes('Linux')) deviceInfo.os = 'Linux';
      else if (userAgent.includes('Android')) deviceInfo.os = 'Android';
      else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) deviceInfo.os = 'iOS';
      
      if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
        deviceInfo.device = 'Mobile';
      } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
        deviceInfo.device = 'Tablet';
      } else {
        deviceInfo.device = 'Desktop';
      }
    }
    
    const subscriptionDoc = {
      customerId: customer._id,
      subscription,
      userAgent,
      ip,
      country: geo ? geo.country : null,
      city: geo ? geo.city : null,
      region: geo ? geo.region : null,
      timezone: geo ? geo.timezone : null,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      device: deviceInfo.device,
      tags: [], // For manual tagging
      segments: [], // Auto-assigned segments
      engagementScore: 0, // Based on opens/clicks
      lastActive: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    
    const doc = await subscriptions.insert(subscriptionDoc);
    
    // Trigger webhook event
    await triggerWebhookEvent(customer._id, 'subscription.created', {
      subscription_id: doc._id,
      endpoint: subscription.endpoint,
      country: doc.country,
      city: doc.city,
      browser: doc.browser,
      os: doc.os,
      device: doc.device,
      created_at: doc.createdAt
    });
    
    res.status(201).json({ id: doc._id, status: 'subscribed' });
  }
);

// Remove subscription
router.post(
  '/unsubscribe',
  body('apiKey').isString(),
  body('endpoint').isString(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { apiKey, endpoint } = req.body;
    const { customers, subscriptions } = getDatastores();
    const customer = await customers.findOne({ apiKey, active: true });
    if (!customer) return res.status(404).json({ error: 'Invalid apiKey' });
    const removedCount = await subscriptions.remove({ customerId: customer._id, 'subscription.endpoint': endpoint }, { multi: true });
    
    // Trigger webhook event if subscription was found and removed
    if (removedCount > 0) {
      await triggerWebhookEvent(customer._id, 'subscription.deleted', {
        endpoint,
        removed_count: removedCount,
        removed_at: new Date().toISOString()
      });
    }
    
    res.json({ status: 'unsubscribed' });
  }
);

module.exports = router;


