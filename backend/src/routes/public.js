const express = require('express');
const { body, validationResult } = require('express-validator');
const webpush = require('web-push');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
const crypto = require('crypto');
const geoip = require('geoip-lite');
const { subscriptionLimiter } = require('../middleware/rateLimiter');
const { triggerWebhookEvent } = require('./webhooks');

const router = express.Router();

// Public SDK endpoints

// Verify API key and get site config (e.g., VAPID public key)
router.get('/config', async (req, res) => {
  try {
    const apiKey = req.query.apiKey;
    if (!apiKey) return res.status(400).json({ error: 'Missing apiKey' });
    
    // Find customer by API key
    const [customers] = await query('SELECT * FROM customers WHERE api_key = ? AND status = "active"', [apiKey]);
    const customer = customers[0];
    if (!customer) return res.status(404).json({ error: 'Invalid apiKey' });

    // Get or create push settings
    let [settings] = await query('SELECT * FROM push_settings WHERE customer_id = ?', [customer.id]);
    
    if (!settings || settings.length === 0) {
      // Create default settings
      const vapidKeys = webpush.generateVAPIDKeys();
      
      await query(`
        INSERT INTO push_settings (customer_id, vapid_public_key, vapid_private_key, vapid_subject, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [customer.id, vapidKeys.publicKey, vapidKeys.privateKey, `mailto:${customer.email}`, new Date(), new Date()]);
      
      settings = [{ vapid_public_key: vapidKeys.publicKey }];
    }

    res.json({
      vapid_public_key: settings[0].vapid_public_key,
      customer_name: customer.name
    });

  } catch (error) {
    console.error('Config error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Subscribe a user
router.post('/subscribe', 
  subscriptionLimiter,
  body('apiKey').isString(),
  body('subscription').isObject(),
  body('subscription.endpoint').isURL(),
  body('subscription.keys.p256dh').isString(),
  body('subscription.keys.auth').isString(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { apiKey, subscription } = req.body;
      
      // Find customer by API key
      const [customers] = await query('SELECT * FROM customers WHERE api_key = ? AND status = "active"', [apiKey]);
      const customer = customers[0];
      if (!customer) {
        return res.status(404).json({ error: 'Invalid API key' });
      }

      const userAgent = req.headers['user-agent'] || '';
      const ip = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
      const geo = geoip.lookup(ip);

      // Check if subscription already exists
      const [existing] = await query(
        'SELECT * FROM push_subscriptions WHERE customer_id = ? AND endpoint = ?',
        [customer.id, subscription.endpoint]
      );

      const subscriptionData = {
        customer_id: customer.id,
        endpoint: subscription.endpoint,
        p256dh_key: subscription.keys.p256dh,
        auth_key: subscription.keys.auth,
        status: 'active',
        user_agent: userAgent,
        ip_address: ip,
        country: geo?.country || null,
        device: userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone') ? 'mobile' : 'desktop',
        subscribed_at: new Date(),
        updated_at: new Date()
      };

      if (existing.length > 0) {
        // Update existing subscription
        await query(`
          UPDATE push_subscriptions 
          SET p256dh_key = ?, auth_key = ?, status = 'active', user_agent = ?, ip_address = ?, 
              country = ?, device = ?, subscribed_at = ?, updated_at = ?
          WHERE customer_id = ? AND endpoint = ?
        `, [
          subscriptionData.p256dh_key, subscriptionData.auth_key, subscriptionData.user_agent,
          subscriptionData.ip_address, subscriptionData.country, subscriptionData.device,
          subscriptionData.subscribed_at, subscriptionData.updated_at,
          customer.id, subscription.endpoint
        ]);

        // Trigger webhook
        try {
          await triggerWebhookEvent(customer.id, 'subscription_updated', {
            endpoint: subscription.endpoint,
            country: subscriptionData.country,
            device: subscriptionData.device
          });
        } catch (webhookError) {
          console.error('Webhook trigger error:', webhookError);
        }

        res.json({ message: 'Subscription updated successfully' });
      } else {
        // Create new subscription
        const subscriptionId = uuidv4();
        
        await query(`
          INSERT INTO push_subscriptions 
          (id, customer_id, endpoint, p256dh_key, auth_key, status, user_agent, ip_address, country, device, subscribed_at, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          subscriptionId, subscriptionData.customer_id, subscriptionData.endpoint,
          subscriptionData.p256dh_key, subscriptionData.auth_key, subscriptionData.status,
          subscriptionData.user_agent, subscriptionData.ip_address, subscriptionData.country,
          subscriptionData.device, subscriptionData.subscribed_at, new Date(), subscriptionData.updated_at
        ]);

        // Trigger webhook
        try {
          await triggerWebhookEvent(customer.id, 'subscription_created', {
            subscription_id: subscriptionId,
            endpoint: subscription.endpoint,
            country: subscriptionData.country,
            device: subscriptionData.device
          });
        } catch (webhookError) {
          console.error('Webhook trigger error:', webhookError);
        }

        res.json({ message: 'Subscription created successfully' });
      }

    } catch (error) {
      console.error('Subscription error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Unsubscribe a user
router.post('/unsubscribe',
  body('apiKey').isString(),
  body('endpoint').isURL(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { apiKey, endpoint } = req.body;
      
      // Find customer by API key
      const [customers] = await query('SELECT * FROM customers WHERE api_key = ? AND status = "active"', [apiKey]);
      const customer = customers[0];
      if (!customer) {
        return res.status(404).json({ error: 'Invalid API key' });
      }

      // Remove subscription(s) with this endpoint
      const result = await query(
        'DELETE FROM push_subscriptions WHERE customer_id = ? AND endpoint = ?',
        [customer.id, endpoint]
      );

      if (result[0].affectedRows > 0) {
        // Trigger webhook
        try {
          await triggerWebhookEvent(customer.id, 'subscription_deleted', {
            endpoint: endpoint
          });
        } catch (webhookError) {
          console.error('Webhook trigger error:', webhookError);
        }

        res.json({ message: 'Unsubscribed successfully', removed: result[0].affectedRows });
      } else {
        res.status(404).json({ error: 'Subscription not found' });
      }

    } catch (error) {
      console.error('Unsubscribe error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Get subscription count for a customer
router.get('/subscribers/count/:apiKey', async (req, res) => {
  try {
    const { apiKey } = req.params;
    
    // Find customer by API key
    const [customers] = await query('SELECT * FROM customers WHERE api_key = ? AND status = "active"', [apiKey]);
    const customer = customers[0];
    if (!customer) {
      return res.status(404).json({ error: 'Invalid API key' });
    }

    const [result] = await query(
      'SELECT COUNT(*) as count FROM push_subscriptions WHERE customer_id = ? AND status = "active"',
      [customer.id]
    );

    res.json({ count: result[0].count });

  } catch (error) {
    console.error('Subscriber count error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Test endpoint to verify subscription
router.post('/test-notification',
  body('apiKey').isString(),
  body('endpoint').isURL(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { apiKey, endpoint } = req.body;
      
      // Find customer by API key
      const [customers] = await query('SELECT * FROM customers WHERE api_key = ? AND status = "active"', [apiKey]);
      const customer = customers[0];
      if (!customer) {
        return res.status(404).json({ error: 'Invalid API key' });
      }

      // Get push settings
      const [settings] = await query('SELECT * FROM push_settings WHERE customer_id = ?', [customer.id]);
      if (!settings || !settings[0]) {
        return res.status(400).json({ error: 'Push notifications not configured' });
      }

      // Find subscription
      const [subscriptions] = await query(
        'SELECT * FROM push_subscriptions WHERE customer_id = ? AND endpoint = ? AND status = "active"',
        [customer.id, endpoint]
      );

      if (subscriptions.length === 0) {
        return res.status(404).json({ error: 'Active subscription not found' });
      }

      const subscription = subscriptions[0];

      // Send test notification
      webpush.setVapidDetails(
        settings[0].vapid_subject,
        settings[0].vapid_public_key,
        settings[0].vapid_private_key
      );

      const payload = {
        title: 'Test Notification',
        body: `Hello from ${customer.name}! Your push notifications are working correctly.`,
        icon: '/icon.png',
        tag: 'test'
      };

      await webpush.sendNotification({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh_key,
          auth: subscription.auth_key
        }
      }, JSON.stringify(payload));

      res.json({ message: 'Test notification sent successfully' });

    } catch (error) {
      console.error('Test notification error:', error);
      if (error.statusCode === 410) {
        // Subscription has expired, remove it
        try {
          await query(
            'UPDATE push_subscriptions SET status = "expired" WHERE customer_id = ? AND endpoint = ?',
            [req.body.customer_id, req.body.endpoint]
          );
        } catch (updateError) {
          console.error('Failed to update expired subscription:', updateError);
        }
        res.status(410).json({ error: 'Subscription expired' });
      } else {
        res.status(500).json({ error: 'Failed to send test notification' });
      }
    }
  }
);

module.exports = router;