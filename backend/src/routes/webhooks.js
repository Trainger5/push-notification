const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
const { requireAuth, requireRole } = require('../middleware/auth');
const crypto = require('crypto');
const axios = require('axios');

const router = express.Router();

router.use(requireAuth, requireRole('customer'));

// Create a webhook
router.post('/create',
  body('name').isString().notEmpty().isLength({ min: 1, max: 100 }),
  body('url').isURL(),
  body('events').isArray().notEmpty(),
  body('secret').optional().isString().isLength({ min: 8, max: 100 }),
  body('is_active').optional().isBoolean(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Get customer
      const [customers] = await query('SELECT * FROM customers WHERE user_id = ?', [req.user.user_id]);
      const customer = customers[0];
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      const webhookId = uuidv4();
      const webhook = {
        id: webhookId,
        customer_id: customer.id,
        name: req.body.name,
        url: req.body.url,
        events: JSON.stringify(req.body.events),
        secret: req.body.secret || crypto.randomBytes(32).toString('hex'),
        is_active: req.body.is_active !== false,
        created_by: req.user.user_id,
        created_at: new Date(),
        updated_at: new Date()
      };

      await query(`
        INSERT INTO webhooks 
        (id, customer_id, name, url, events, secret, is_active, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        webhook.id, webhook.customer_id, webhook.name, webhook.url,
        webhook.events, webhook.secret, webhook.is_active, webhook.created_by,
        webhook.created_at, webhook.updated_at
      ]);

      // Don't return secret in response for security
      const responseWebhook = { ...webhook, secret: undefined };
      responseWebhook.events = JSON.parse(webhook.events);

      res.status(201).json({
        message: 'Webhook created successfully',
        webhook: responseWebhook
      });

    } catch (error) {
      console.error('Webhook creation error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Get all webhooks for customer
router.get('/list', async (req, res) => {
  try {
    // Get customer
    const [customers] = await query('SELECT * FROM customers WHERE user_id = ?', [req.user.user_id]);
    const customer = customers[0];
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const [webhooks] = await query(`
      SELECT w.*, c.name as customer_name
      FROM webhooks w
      JOIN customers c ON w.customer_id = c.id
      WHERE w.customer_id = ?
      ORDER BY w.created_at DESC
    `, [customer.id]);

    // Parse JSON events and hide secrets
    const processedWebhooks = webhooks.map(webhook => ({
      ...webhook,
      events: webhook.events ? JSON.parse(webhook.events) : [],
      secret: undefined // Don't expose secrets
    }));

    res.json({
      webhooks: processedWebhooks,
      total: webhooks.length
    });

  } catch (error) {
    console.error('Webhooks list error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete webhook
router.delete('/:id', async (req, res) => {
  try {
    // Get customer
    const [customers] = await query('SELECT * FROM customers WHERE user_id = ?', [req.user.user_id]);
    const customer = customers[0];
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const [webhooks] = await query(
      'SELECT id FROM webhooks WHERE id = ? AND customer_id = ?',
      [req.params.id, customer.id]
    );

    if (webhooks.length === 0) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    await query(
      'DELETE FROM webhooks WHERE id = ? AND customer_id = ?',
      [req.params.id, customer.id]
    );

    res.json({ message: 'Webhook deleted successfully' });

  } catch (error) {
    console.error('Webhook delete error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Trigger webhook event (internal function)
async function triggerWebhookEvent(customer_id, event, data) {
  try {
    // Get active webhooks for this customer that listen to this event
    const [webhooks] = await query(
      'SELECT * FROM webhooks WHERE customer_id = ? AND is_active = true',
      [customer_id]
    );

    for (const webhook of webhooks) {
      const events = JSON.parse(webhook.events);
      if (events.includes(event) || events.includes('*')) {
        const payload = {
          event,
          timestamp: new Date().toISOString(),
          customer_id,
          data
        };

        // Create signature
        const signature = crypto
          .createHmac('sha256', webhook.secret)
          .update(JSON.stringify(payload))
          .digest('hex');

        try {
          await axios.post(webhook.url, payload, {
            headers: {
              'Content-Type': 'application/json',
              'X-Webhook-Signature': `sha256=${signature}`,
              'User-Agent': 'PushNotification-Webhook/1.0'
            },
            timeout: 10000
          });
        } catch (webhookError) {
          console.error('Webhook delivery failed:', webhookError.message);
        }
      }
    }
  } catch (error) {
    console.error('Webhook event trigger error:', error);
  }
}

module.exports = { router, triggerWebhookEvent };
module.exports.router = router;