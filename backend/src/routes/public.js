const express = require('express');
const { body, validationResult } = require('express-validator');
const webpush = require('web-push');
const { getDatastores } = require('../storage/datastores');
const crypto = require('crypto');

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
    const doc = await subscriptions.insert({ customerId: customer._id, subscription, createdAt: new Date().toISOString() });
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
    await subscriptions.remove({ customerId: customer._id, 'subscription.endpoint': endpoint }, { multi: true });
    res.json({ status: 'unsubscribed' });
  }
);

module.exports = router;


