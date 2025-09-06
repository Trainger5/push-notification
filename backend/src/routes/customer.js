const express = require('express');
const { body, validationResult } = require('express-validator');
const webpush = require('web-push');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
const { requireAuth, requireRole } = require('../middleware/auth');
const { notificationLimiter, planBasedLimiter } = require('../middleware/rateLimiter');
const { triggerWebhookEvent } = require('./webhooks');

const router = express.Router();
const DEBUG_PUSH = ['1', 'true', 'on', 'yes'].includes(String(process.env.DEBUG_PUSH || '').toLowerCase());

router.use(requireAuth, requireRole('customer'));

// Get own push settings and subscribers
router.get('/me', async (req, res) => {
  try {
    // Get customer
    const customers = await query('SELECT * FROM customers WHERE user_id = ?', [req.user.user_id]);
    const customer = customers && customers.length > 0 ? customers[0] : null;
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Get push settings
    const settings = await query('SELECT * FROM push_settings WHERE customer_id = ?', [customer.id]);
    const pushSettings = settings && settings.length > 0 ? settings[0] : null;

    // Get subscriber count
    const subCount = await query('SELECT COUNT(*) as count FROM push_subscriptions WHERE customer_id = ?', [customer.id]);
    const count = subCount && subCount.length > 0 ? subCount[0].count : 0;

    // Get notification stats
    const notifications = await query('SELECT sent_count, failed_count FROM notifications WHERE customer_id = ?', [customer.id]);
    const notificationList = Array.isArray(notifications) ? notifications : [];
    const successTotal = notificationList.reduce((acc, n) => acc + (Number(n.sent_count) || 0), 0);
    const failTotal = notificationList.reduce((acc, n) => acc + (Number(n.failed_count) || 0), 0);
    const totalSends = notificationList.length;

    // Get metrics
    const openMetrics = await query('SELECT COUNT(*) as count FROM metrics WHERE customer_id = ? AND event_type = "opened"', [customer.id]);
    const clickMetrics = await query('SELECT COUNT(*) as count FROM metrics WHERE customer_id = ? AND event_type = "clicked"', [customer.id]);
    
    const opens = openMetrics && openMetrics.length > 0 ? openMetrics[0].count : 0;
    const clicks = clickMetrics && clickMetrics.length > 0 ? clickMetrics[0].count : 0;
    const delivered = successTotal || 0;
    const openRate = delivered > 0 ? Math.round((opens / delivered) * 100) : 0;
    const clickRate = delivered > 0 ? Math.round((clicks / delivered) * 100) : 0;

    res.json({
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        plan: customer.plan,
        status: customer.status
      },
      settings: pushSettings,
      stats: {
        subscribers: count,
        notifications_sent: totalSends,
        delivered,
        failed: failTotal,
        opens,
        clicks,
        open_rate: openRate,
        click_rate: clickRate
      }
    });

  } catch (error) {
    console.error('Customer stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update push settings
router.put('/settings', 
  body('vapid_subject').optional().isEmail(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Get customer
      const customers = await query('SELECT * FROM customers WHERE user_id = ?', [req.user.user_id]);
      const customer = customers && customers.length > 0 ? customers[0] : null;
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      // Check if settings exist
      const existing = await query('SELECT * FROM push_settings WHERE customer_id = ?', [customer.id]);
      
      const updateData = {
        ...req.body,
        customer_id: customer.id,
        updated_at: new Date()
      };

      if (existing.length > 0) {
        // Update existing settings
        const updates = [];
        const params = [];
        
        Object.keys(req.body).forEach(key => {
          if (req.body[key] !== undefined) {
            updates.push(`${key} = ?`);
            params.push(req.body[key]);
          }
        });
        
        updates.push('updated_at = ?');
        params.push(new Date());
        params.push(customer.id);

        await query(`UPDATE push_settings SET ${updates.join(', ')} WHERE customer_id = ?`, params);
      } else {
        // Create new settings
        await query(`
          INSERT INTO push_settings (customer_id, vapid_subject, updated_at, created_at)
          VALUES (?, ?, ?, ?)
        `, [customer.id, updateData.vapid_subject || `mailto:${customer.email}`, new Date(), new Date()]);
      }

      res.json({ message: 'Settings updated successfully' });

    } catch (error) {
      console.error('Settings update error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Send notification to all subscribers
router.post('/notify', 
  planBasedLimiter,
  notificationLimiter,
  body('title').isString().notEmpty().isLength({ min: 1, max: 100 }),
  body('body').isString().notEmpty().isLength({ min: 1, max: 500 }),
  body('url').optional(),
  body('icon').optional().isString(),
  body('tag').optional().isString(),
  async (req, res) => {
    console.log('🔔 CUSTOMER NOTIFY ROUTE HIT!');
    
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Get customer
      const customers = await query('SELECT * FROM customers WHERE user_id = ?', [req.user.user_id]);
      const customer = customers && customers.length > 0 ? customers[0] : null;
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      // Get push settings
      const settings = await query('SELECT * FROM push_settings WHERE customer_id = ?', [customer.id]);
      if (!settings || !settings[0]) {
        return res.status(400).json({ error: 'Push notifications not configured. Please set up VAPID keys first.' });
      }

      // Get active subscriptions
      const subscriptions = await query(
        'SELECT * FROM push_subscriptions WHERE customer_id = ? AND status = "active"',
        [customer.id]
      );

      if (subscriptions.length === 0) {
        return res.json({ sent: 0, failed: 0, message: 'No active subscriptions found' });
      }

      const vapidSettings = settings[0];
      webpush.setVapidDetails(
        vapidSettings.vapid_subject,
        vapidSettings.vapid_public_key,
        vapidSettings.vapid_private_key
      );

      const payload = {
        title: req.body.title,
        body: req.body.body,
        url: req.body.url || '/',
        icon: req.body.icon || '/icon.png',
        tag: req.body.tag || 'default',
        timestamp: Date.now()
      };

      let sent = 0;
      let failed = 0;

      // Send notifications in parallel
      const results = await Promise.allSettled(
        subscriptions.map(async (subscription) => {
          try {
            await webpush.sendNotification({
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.p256dh_key,
                auth: subscription.auth_key
              }
            }, JSON.stringify(payload));
            return { success: true, subscription };
          } catch (error) {
            console.error('Failed to send notification:', error);
            return { success: false, subscription, error };
          }
        })
      );

      // Count results
      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value.success) {
          sent++;
        } else {
          failed++;
        }
      });

      // Record notification
      const notificationId = uuidv4();
      await query(`
        INSERT INTO notifications 
        (id, customer_id, title, body, url, icon, status, sent_count, failed_count, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 'sent', ?, ?, ?, ?)
      `, [
        notificationId, customer.id, payload.title, payload.body, 
        payload.url, payload.icon, sent, failed, new Date(), new Date()
      ]);

      // Trigger webhook event
      try {
        await triggerWebhookEvent(customer.id, 'notification_sent', {
          notification_id: notificationId,
          title: payload.title,
          sent_count: sent,
          failed_count: failed
        });
      } catch (webhookError) {
        console.error('Webhook trigger error:', webhookError);
      }

      console.log('[push] summary', { customer_id: customer.id, total: results.length, sent, failed });

      res.json({ sent, failed });

    } catch (error) {
      console.error('Notification send error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Generate new VAPID keys
router.post('/vapid/generate', async (req, res) => {
  try {
    // Get customer
    const customers = await query('SELECT * FROM customers WHERE user_id = ?', [req.user.user_id]);
    const customer = customers && customers.length > 0 ? customers[0] : null;
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const keys = webpush.generateVAPIDKeys();
    
    const settingsData = { 
      customer_id: customer.id, 
      vapid_public_key: keys.publicKey, 
      vapid_private_key: keys.privateKey, 
      vapid_subject: `mailto:${customer.email}`,
      updated_at: new Date(),
      created_at: new Date()
    };

    // Check if settings exist
    const [existing] = await query('SELECT id FROM push_settings WHERE customer_id = ?', [customer.id]);
    
    if (existing.length > 0) {
      await query(`
        UPDATE push_settings 
        SET vapid_public_key = ?, vapid_private_key = ?, vapid_subject = ?, updated_at = ?
        WHERE customer_id = ?
      `, [keys.publicKey, keys.privateKey, settingsData.vapid_subject, new Date(), customer.id]);
    } else {
      await query(`
        INSERT INTO push_settings (customer_id, vapid_public_key, vapid_private_key, vapid_subject, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [customer.id, keys.publicKey, keys.privateKey, settingsData.vapid_subject, new Date(), new Date()]);
    }

    res.json({ 
      message: 'VAPID keys generated successfully',
      publicKey: keys.publicKey 
    });

  } catch (error) {
    console.error('VAPID generation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get recent notifications
router.get('/notifications', async (req, res) => {
  try {
    // Get customer
    const customers = await query('SELECT * FROM customers WHERE user_id = ?', [req.user.user_id]);
    const customer = customers && customers.length > 0 ? customers[0] : null;
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const notifications = await query(`
      SELECT * FROM notifications 
      WHERE customer_id = ? 
      ORDER BY created_at DESC 
      LIMIT 50
    `, [customer.id]);

    res.json({ notifications });

  } catch (error) {
    console.error('Notifications fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get recent subscriptions
router.get('/subscribers', async (req, res) => {
  try {
    // Get customer
    const customers = await query('SELECT * FROM customers WHERE user_id = ?', [req.user.user_id]);
    const customer = customers && customers.length > 0 ? customers[0] : null;
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const subscriptions = await query(`
      SELECT ps.*, c.name as customer_name
      FROM push_subscriptions ps
      JOIN customers c ON ps.customer_id = c.id
      WHERE ps.customer_id = ? 
      ORDER BY ps.subscribed_at DESC 
      LIMIT 100
    `, [customer.id]);

    // Parse user agent to get browser info
    const subscribersWithBrowserInfo = subscriptions.map(sub => ({
      ...sub,
      browser: sub.user_agent ? (
        sub.user_agent.includes('Chrome') ? 'Chrome' :
        sub.user_agent.includes('Firefox') ? 'Firefox' :
        sub.user_agent.includes('Safari') ? 'Safari' :
        sub.user_agent.includes('Edge') ? 'Edge' : 'Unknown'
      ) : 'Unknown'
    }));

    res.json({ subscriptions: subscribersWithBrowserInfo });

  } catch (error) {
    console.error('Subscribers fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;