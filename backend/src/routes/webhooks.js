const express = require('express');
const { body, validationResult } = require('express-validator');
const { getDatastores } = require('../storage/datastores');
const { requireAuth, requireRole } = require('../middleware/auth');
const crypto = require('crypto');

const router = express.Router();

router.use(requireAuth, requireRole('customer'));

// Create a new webhook endpoint
router.post(
  '/create',
  body('name').isString().notEmpty().isLength({ min: 1, max: 100 }),
  body('url').isURL(),
  body('events').isArray().notEmpty(),
  body('description').optional().isString().isLength({ max: 500 }),
  body('secret').optional().isString().isLength({ min: 16, max: 64 }),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { customers, webhooks } = getDatastores();
      const customer = await customers.findOne({ userId: req.user.userId });
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      // Check if webhook name already exists for this customer
      const existingWebhook = await webhooks.findOne({
        customerId: customer._id,
        name: req.body.name
      });
      
      if (existingWebhook) {
        return res.status(409).json({ error: 'Webhook with this name already exists' });
      }

      // Generate secret if not provided
      const secret = req.body.secret || crypto.randomBytes(32).toString('hex');

      const webhook = {
        customerId: customer._id,
        name: req.body.name,
        url: req.body.url,
        events: req.body.events,
        description: req.body.description || '',
        secret,
        isActive: true,
        deliveredCount: 0,
        failedCount: 0,
        lastDelivery: null,
        lastStatus: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: req.user.userId
      };

      const newWebhook = await webhooks.insert(webhook);
      
      // Don't return the secret in the response for security
      const responseWebhook = { ...newWebhook };
      delete responseWebhook.secret;
      
      res.status(201).json({
        webhook: responseWebhook,
        message: 'Webhook created successfully'
      });
    } catch (error) {
      console.error('Create webhook error:', error);
      res.status(500).json({ error: 'Failed to create webhook' });
    }
  }
);

// Get all webhooks for customer
router.get('/list', async (req, res) => {
  try {
    const { customers, webhooks } = getDatastores();
    const customer = await customers.findOne({ userId: req.user.userId });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const customerWebhooks = await webhooks.find({ customerId: customer._id }).sort({ updatedAt: -1 });
    
    // Don't return secrets in the list
    const safeWebhooks = customerWebhooks.map(webhook => {
      const { secret, ...safeWebhook } = webhook;
      return safeWebhook;
    });

    res.json({
      webhooks: safeWebhooks,
      total: safeWebhooks.length
    });
  } catch (error) {
    console.error('Get webhooks error:', error);
    res.status(500).json({ error: 'Failed to retrieve webhooks' });
  }
});

// Get specific webhook
router.get('/:id', async (req, res) => {
  try {
    const { customers, webhooks } = getDatastores();
    const customer = await customers.findOne({ userId: req.user.userId });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const webhook = await webhooks.findOne({
      _id: req.params.id,
      customerId: customer._id
    });

    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    // Don't return the secret
    const { secret, ...safeWebhook } = webhook;
    res.json(safeWebhook);
  } catch (error) {
    console.error('Get webhook error:', error);
    res.status(500).json({ error: 'Failed to retrieve webhook' });
  }
});

// Update webhook
router.put(
  '/:id',
  body('name').optional().isString().notEmpty().isLength({ min: 1, max: 100 }),
  body('url').optional().isURL(),
  body('events').optional().isArray().notEmpty(),
  body('description').optional().isString().isLength({ max: 500 }),
  body('isActive').optional().isBoolean(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { customers, webhooks } = getDatastores();
      const customer = await customers.findOne({ userId: req.user.userId });
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      const webhook = await webhooks.findOne({
        _id: req.params.id,
        customerId: customer._id
      });

      if (!webhook) {
        return res.status(404).json({ error: 'Webhook not found' });
      }

      // If name is being changed, check for conflicts
      if (req.body.name && req.body.name !== webhook.name) {
        const existingWebhook = await webhooks.findOne({
          customerId: customer._id,
          name: req.body.name,
          _id: { $ne: req.params.id }
        });
        
        if (existingWebhook) {
          return res.status(409).json({ error: 'Webhook with this name already exists' });
        }
      }

      const updates = {
        ...req.body,
        updatedAt: new Date().toISOString()
      };

      await webhooks.update(
        { _id: req.params.id },
        { $set: updates }
      );

      const updatedWebhook = await webhooks.findOne({ _id: req.params.id });
      
      // Don't return the secret
      const { secret, ...safeWebhook } = updatedWebhook;

      res.json({
        webhook: safeWebhook,
        message: 'Webhook updated successfully'
      });
    } catch (error) {
      console.error('Update webhook error:', error);
      res.status(500).json({ error: 'Failed to update webhook' });
    }
  }
);

// Delete webhook
router.delete('/:id', async (req, res) => {
  try {
    const { customers, webhooks } = getDatastores();
    const customer = await customers.findOne({ userId: req.user.userId });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const webhook = await webhooks.findOne({
      _id: req.params.id,
      customerId: customer._id
    });

    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    await webhooks.remove({ _id: req.params.id });

    res.json({
      message: 'Webhook deleted successfully'
    });
  } catch (error) {
    console.error('Delete webhook error:', error);
    res.status(500).json({ error: 'Failed to delete webhook' });
  }
});

// Test webhook endpoint
router.post('/:id/test', async (req, res) => {
  try {
    const { customers, webhooks } = getDatastores();
    const customer = await customers.findOne({ userId: req.user.userId });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const webhook = await webhooks.findOne({
      _id: req.params.id,
      customerId: customer._id
    });

    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    // Send test webhook
    const testPayload = {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook delivery',
        webhook_id: webhook._id,
        webhook_name: webhook.name
      }
    };

    const result = await sendWebhook(webhook, testPayload);

    res.json({
      success: result.success,
      status: result.status,
      message: result.success ? 'Test webhook sent successfully' : 'Test webhook failed'
    });
  } catch (error) {
    console.error('Test webhook error:', error);
    res.status(500).json({ error: 'Failed to send test webhook' });
  }
});

// Get webhook deliveries/logs
router.get('/:id/deliveries', async (req, res) => {
  try {
    const { customers, webhooks, webhookDeliveries } = getDatastores();
    const customer = await customers.findOne({ userId: req.user.userId });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const webhook = await webhooks.findOne({
      _id: req.params.id,
      customerId: customer._id
    });

    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const allDeliveries = await webhookDeliveries.find({ webhookId: webhook._id }).sort({ createdAt: -1 });
    const deliveries = allDeliveries.slice(skip, skip + limit);

    res.json({
      deliveries,
      total: allDeliveries.length,
      page,
      totalPages: Math.ceil(allDeliveries.length / limit)
    });
  } catch (error) {
    console.error('Get webhook deliveries error:', error);
    res.status(500).json({ error: 'Failed to retrieve webhook deliveries' });
  }
});

// Helper function to send webhooks
async function sendWebhook(webhook, payload) {
  const { webhookDeliveries } = getDatastores();
  
  try {
    const signature = crypto
      .createHmac('sha256', webhook.secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': `sha256=${signature}`,
        'User-Agent': 'PushNotificationService/1.0'
      },
      body: JSON.stringify(payload),
      timeout: 10000
    });

    const success = response.status >= 200 && response.status < 300;
    const responseText = await response.text().catch(() => '');

    // Log the delivery
    await webhookDeliveries.insert({
      webhookId: webhook._id,
      customerId: webhook.customerId,
      event: payload.event,
      payload,
      status: response.status,
      success,
      response: responseText.substring(0, 1000), // Limit response size
      deliveredAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    });

    // Update webhook stats
    const { webhooks } = getDatastores();
    const updateStats = success 
      ? { $inc: { deliveredCount: 1 }, $set: { lastDelivery: new Date().toISOString(), lastStatus: 'success' } }
      : { $inc: { failedCount: 1 }, $set: { lastDelivery: new Date().toISOString(), lastStatus: 'failed' } };
    
    await webhooks.update({ _id: webhook._id }, updateStats);

    return { success, status: response.status };
  } catch (error) {
    console.error('Webhook delivery error:', error);
    
    // Log the failed delivery
    await webhookDeliveries.insert({
      webhookId: webhook._id,
      customerId: webhook.customerId,
      event: payload.event,
      payload,
      status: 0,
      success: false,
      response: error.message,
      deliveredAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    });

    // Update webhook stats
    const { webhooks } = getDatastores();
    await webhooks.update(
      { _id: webhook._id }, 
      { $inc: { failedCount: 1 }, $set: { lastDelivery: new Date().toISOString(), lastStatus: 'failed' } }
    );

    return { success: false, status: 0 };
  }
}

// Function to trigger webhook events (used by other parts of the application)
async function triggerWebhookEvent(customerId, event, data) {
  const { webhooks } = getDatastores();
  
  // Find all active webhooks for this customer that listen for this event
  const customerWebhooks = await webhooks.find({
    customerId,
    isActive: true,
    events: { $in: [event] }
  });

  const payload = {
    event,
    timestamp: new Date().toISOString(),
    data
  };

  // Send webhooks in parallel
  const promises = customerWebhooks.map(webhook => sendWebhook(webhook, payload));
  await Promise.allSettled(promises);
}

module.exports = { router, triggerWebhookEvent };