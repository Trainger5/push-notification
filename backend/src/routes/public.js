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
  const customer = await customers.findOne({ api_key: apiKey, status: 'active' });
  if (!customer) return res.status(404).json({ error: 'Invalid apiKey' });
  let settings = await pushSettings.findOne({ customer_id: customer.id });
  if (!settings || !settings.vapid_public_key || !settings.vapid_private_key) {
    const keys = webpush.generateVAPIDKeys();
    const doc = {
      customer_id: customer.id,
      vapid_public_key: keys.publicKey,
      vapid_private_key: keys.privateKey,
      vapid_subject: settings?.vapid_subject || process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
      default_title: settings?.default_title || `${customer.name || 'Notifications'}`,
      default_icon_url: settings?.default_icon_url || null,
      default_badge_url: settings?.default_badge_url || null,
      default_url: settings?.default_url || null,
      updated_at: new Date().toISOString()
    };
    if (settings) {
      await pushSettings.update({ id: settings.id }, { $set: doc });
      settings = { ...settings, ...doc };
    } else {
      settings = await pushSettings.insert({ ...doc, created_at: new Date().toISOString() });
    }
  }
  res.json({ vapid_public_key: settings?.vapid_public_key || process.env.VAPID_PUBLIC_KEY || null, title: settings?.default_title || null, iconUrl: settings?.default_icon_url || null, badgeUrl: settings?.default_badge_url || null, defaultUrl: settings?.default_url || null });
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
    const customer = await customers.findOne({ api_key: apiKey, status: 'active' });
    if (!customer) return res.status(404).json({ error: 'Invalid apiKey' });
    
    // Check if exact same endpoint already exists
    const exists = await subscriptions.findOne({ customer_id: customer.id, endpoint: subscription.endpoint });
    if (exists) return res.json({ status: 'exists', id: exists.id });
    
    // Get IP and user agent for duplicate detection and metadata
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';
    
    // Only remove old subscriptions with DIFFERENT endpoints from same device
    // This prevents removing the current valid subscription
    if (ip && userAgent) {
      const oldSubs = await subscriptions.find({ 
        customer_id: customer.id, 
        ip_address: ip,
        user_agent: userAgent 
      });
      
      // Remove only subscriptions with different endpoints
      for (const oldSub of oldSubs) {
        if (oldSub.endpoint !== subscription.endpoint) {
          await subscriptions.remove({ id: oldSub.id });
          console.log(`Removed old subscription from same device with different endpoint`);
        }
      }
    }
    
    // Enhanced subscription document with metadata for analytics and segmentation
    const geo = geoip.lookup(ip);
    
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
      customer_id: customer.id,
      endpoint: subscription.endpoint,
      p256dh_key: subscription.keys.p256dh,
      auth_key: subscription.keys.auth,
      user_agent: userAgent,
      ip_address: ip,
      country: geo ? geo.country : null,
      city: geo ? geo.city : null,
      region: geo ? geo.region : null,
      timezone: geo ? geo.timezone : null,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      device: deviceInfo.device,
      tags: [], // For manual tagging
      segments: [], // Auto-assigned segments
      engagement_score: 0, // Based on opens/clicks
      last_active: new Date(),
      subscribed_at: new Date()
    };
    
    const doc = await subscriptions.insert(subscriptionDoc);
    
    // Trigger webhook event
    await triggerWebhookEvent(customer.id, 'subscription.created', {
      subscription_id: doc.id,
      endpoint: subscription.endpoint,
      country: doc.country,
      city: doc.city,
      browser: doc.browser,
      os: doc.os,
      device: doc.device,
      created_at: doc.subscribed_at
    });
    
    res.status(201).json({ id: doc.id, status: 'subscribed' });
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
    const customer = await customers.findOne({ api_key: apiKey, status: 'active' });
    if (!customer) return res.status(404).json({ error: 'Invalid apiKey' });
    const removedCount = await subscriptions.remove({ customer_id: customer.id, endpoint: endpoint }, { multi: true });
    
    // Trigger webhook event if subscription was found and removed
    if (removedCount > 0) {
      await triggerWebhookEvent(customer.id, 'subscription.deleted', {
        endpoint,
        removed_count: removedCount,
        removed_at: new Date().toISOString()
      });
    }
    
    res.json({ status: 'unsubscribed' });
  }
);

module.exports = router;


