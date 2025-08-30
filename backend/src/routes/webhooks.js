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
  body('headers').optional().isObject(),
  body('timeout').optional().isInt({ min: 5, max: 300 }),
  body('maxRetries').optional().isInt({ min: 0, max: 5 }),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { customers, webhooks } = getDatastores();
      const customer = await customers.findOne({ user_id: req.user.userId });
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      // Check if webhook name already exists for this customer
      const existingWebhook = await webhooks.findOne({
        customer_id: customer.id,
        name: req.body.name
      });
      
      if (existingWebhook) {
        return res.status(409).json({ error: 'Webhook with this name already exists' });
      }

      // Validate event types
      const validEvents = ['notification.sent', 'notification.delivered', 'notification.clicked', 'notification.failed', 'subscription.created', 'subscription.deleted'];
      const invalidEvents = req.body.events.filter(event => !validEvents.includes(event));
      
      if (invalidEvents.length > 0) {
        return res.status(400).json({ error: `Invalid events: ${invalidEvents.join(', ')}` });
      }

      // Generate secret if not provided
      const secret = req.body.secret || crypto.randomBytes(32).toString('hex');

      const webhook = {
        customer_id: customer.id,
        name: req.body.name,
        url: req.body.url,
        secret,
        events: JSON.stringify(req.body.events),
        headers: req.body.headers ? JSON.stringify(req.body.headers) : null,
        timeout: req.body.timeout || 30,
        max_retries: req.body.maxRetries || 3,
        retry_delay: 60, // seconds
        last_success: null,
        last_failure: null,
        success_count: 0,
        failure_count: 0,
        success_rate: 100.00,
        status: 'active',
        created_by: req.user.userId,
        created_at: new Date(),
        updated_at: new Date()
      };

      const newWebhook = await webhooks.insert(webhook);
      
      // Don't return the secret in the response for security
      const responseWebhook = { 
        ...newWebhook, 
        events: JSON.parse(newWebhook.events),
        headers: newWebhook.headers ? JSON.parse(newWebhook.headers) : null
      };
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
    const customer = await customers.findOne({ user_id: req.user.userId });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const customerWebhooks = await webhooks.find(
      { customer_id: customer.id }, 
      { sort: { updated_at: -1 } }
    );
    
    // Don't return secrets in the list and parse JSON fields
    const safeWebhooks = customerWebhooks.map(webhook => {
      const { secret, ...safeWebhook } = webhook;
      return {
        ...safeWebhook,
        events: JSON.parse(webhook.events),
        headers: webhook.headers ? JSON.parse(webhook.headers) : null
      };
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
    const customer = await customers.findOne({ user_id: req.user.userId });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const webhook = await webhooks.findOne({
      id: req.params.id,
      customer_id: customer.id
    });

    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    // Don't return the secret and parse JSON fields
    const { secret, ...safeWebhook } = webhook;
    const responseWebhook = {
      ...safeWebhook,
      events: JSON.parse(webhook.events),
      headers: webhook.headers ? JSON.parse(webhook.headers) : null
    };
    
    res.json(responseWebhook);
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
  body('headers').optional().isObject(),
  body('timeout').optional().isInt({ min: 5, max: 300 }),
  body('maxRetries').optional().isInt({ min: 0, max: 5 }),
  body('status').optional().isIn(['active', 'inactive']),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { customers, webhooks } = getDatastores();
      const customer = await customers.findOne({ user_id: req.user.userId });
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      const webhook = await webhooks.findOne({
        id: req.params.id,
        customer_id: customer.id
      });

      if (!webhook) {
        return res.status(404).json({ error: 'Webhook not found' });
      }

      // If name is being changed, check for conflicts
      if (req.body.name && req.body.name !== webhook.name) {
        const existingWebhook = await webhooks.findOne({
          customer_id: customer.id,
          name: req.body.name,
          id: { $ne: req.params.id }
        });
        
        if (existingWebhook) {
          return res.status(409).json({ error: 'Webhook with this name already exists' });
        }
      }

      // Validate events if provided
      if (req.body.events) {
        const validEvents = ['notification.sent', 'notification.delivered', 'notification.clicked', 'notification.failed', 'subscription.created', 'subscription.deleted'];
        const invalidEvents = req.body.events.filter(event => !validEvents.includes(event));
        
        if (invalidEvents.length > 0) {
          return res.status(400).json({ error: `Invalid events: ${invalidEvents.join(', ')}` });
        }
      }

      const updateData = {};
      
      if (req.body.name) updateData.name = req.body.name;
      if (req.body.url) updateData.url = req.body.url;
      if (req.body.events) updateData.events = JSON.stringify(req.body.events);
      if (req.body.headers !== undefined) updateData.headers = req.body.headers ? JSON.stringify(req.body.headers) : null;
      if (req.body.timeout) updateData.timeout = req.body.timeout;
      if (req.body.maxRetries !== undefined) updateData.max_retries = req.body.maxRetries;
      if (req.body.status) updateData.status = req.body.status;
      
      updateData.updated_at = new Date();

      await webhooks.update(
        { id: req.params.id },
        { $set: updateData }
      );

      const updatedWebhook = await webhooks.findOne({ id: req.params.id });
      
      // Don't return the secret and parse JSON fields
      const { secret, ...safeWebhook } = updatedWebhook;
      const responseWebhook = {
        ...safeWebhook,
        events: JSON.parse(updatedWebhook.events),
        headers: updatedWebhook.headers ? JSON.parse(updatedWebhook.headers) : null
      };

      res.json({
        webhook: responseWebhook,
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
    const customer = await customers.findOne({ user_id: req.user.userId });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const webhook = await webhooks.findOne({
      id: req.params.id,
      customer_id: customer.id
    });

    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    await webhooks.remove({ id: req.params.id });

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
    const customer = await customers.findOne({ user_id: req.user.userId });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const webhook = await webhooks.findOne({
      id: req.params.id,
      customer_id: customer.id
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
        webhook_id: webhook.id,
        webhook_name: webhook.name,
        customer_id: customer.id
      }
    };

    const result = await sendWebhook(webhook, testPayload);

    res.json({
      success: result.success,
      status: result.status,
      responseTime: result.responseTime,
      message: result.success ? 'Test webhook sent successfully' : 'Test webhook failed',
      error: result.error || null
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
    const customer = await customers.findOne({ user_id: req.user.userId });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const webhook = await webhooks.findOne({
      id: req.params.id,
      customer_id: customer.id
    });

    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const status = req.query.status; // Filter by status if provided

    let query = { webhook_id: webhook.id };
    if (status && ['pending', 'success', 'failed', 'retrying'].includes(status)) {
      query.status = status;
    }

    // Get total count
    const totalCount = await webhookDeliveries.count(query);
    
    // Get paginated deliveries
    const deliveries = await webhookDeliveries.find(query, { 
      sort: { created_at: -1 }, 
      limit: limit, 
      skip: skip 
    });

    res.json({
      deliveries: deliveries.map(delivery => ({
        ...delivery,
        payload: delivery.payload ? JSON.parse(delivery.payload) : null
      })),
      total: totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit)
    });
  } catch (error) {
    console.error('Get webhook deliveries error:', error);
    res.status(500).json({ error: 'Failed to retrieve webhook deliveries' });
  }
});

// Get webhook statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const { customers, webhooks, webhookDeliveries } = getDatastores();
    const customer = await customers.findOne({ user_id: req.user.userId });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const webhook = await webhooks.findOne({
      id: req.params.id,
      customer_id: customer.id
    });

    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    // Get delivery statistics for the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const recentDeliveries = await webhookDeliveries.find({
      webhook_id: webhook.id,
      created_at: { $gte: thirtyDaysAgo }
    });

    const stats = {
      total_deliveries: webhook.success_count + webhook.failure_count,
      successful_deliveries: webhook.success_count,
      failed_deliveries: webhook.failure_count,
      success_rate: webhook.success_rate,
      last_success: webhook.last_success,
      last_failure: webhook.last_failure,
      status: webhook.status,
      recent_30_days: {
        total: recentDeliveries.length,
        successful: recentDeliveries.filter(d => d.status === 'success').length,
        failed: recentDeliveries.filter(d => d.status === 'failed').length,
        pending: recentDeliveries.filter(d => d.status === 'pending').length,
        retrying: recentDeliveries.filter(d => d.status === 'retrying').length
      }
    };

    // Calculate average response time
    const successfulDeliveries = recentDeliveries.filter(d => d.response_time_ms > 0);
    if (successfulDeliveries.length > 0) {
      const totalResponseTime = successfulDeliveries.reduce((sum, d) => sum + d.response_time_ms, 0);
      stats.average_response_time_ms = Math.round(totalResponseTime / successfulDeliveries.length);
    } else {
      stats.average_response_time_ms = null;
    }

    res.json(stats);
  } catch (error) {
    console.error('Get webhook stats error:', error);
    res.status(500).json({ error: 'Failed to retrieve webhook statistics' });
  }
});

// Helper function to send webhooks
async function sendWebhook(webhook, payload) {
  const { webhookDeliveries } = getDatastores();
  const startTime = Date.now();
  
  try {
    // Create signature
    const signature = crypto
      .createHmac('sha256', webhook.secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
      'X-Webhook-Signature': `sha256=${signature}`,
      'User-Agent': 'PushNotificationService/1.0',
      'X-Webhook-ID': webhook.id,
      'X-Webhook-Event': payload.event
    };

    // Add custom headers if provided
    if (webhook.headers) {
      const customHeaders = JSON.parse(webhook.headers);
      Object.assign(headers, customHeaders);
    }

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout((webhook.timeout || 30) * 1000)
    });

    const responseTime = Date.now() - startTime;
    const success = response.status >= 200 && response.status < 300;
    const responseText = await response.text().catch(() => '');

    // Log the delivery
    await webhookDeliveries.insert({
      webhook_id: webhook.id,
      event_type: payload.event,
      payload: JSON.stringify(payload),
      headers: JSON.stringify(headers),
      status: success ? 'success' : 'failed',
      http_status: response.status,
      response_body: responseText.substring(0, 1000), // Limit response size
      response_time_ms: responseTime,
      retry_count: 0,
      sent_at: new Date(),
      completed_at: new Date(),
      created_at: new Date()
    });

    // Update webhook stats
    const { webhooks } = getDatastores();
    if (success) {
      await webhooks.update({ id: webhook.id }, {
        $set: { 
          last_success: new Date(),
          success_count: webhook.success_count + 1,
          success_rate: ((webhook.success_count + 1) / (webhook.success_count + webhook.failure_count + 1) * 100).toFixed(2)
        }
      });
    } else {
      await webhooks.update({ id: webhook.id }, {
        $set: { 
          last_failure: new Date(),
          failure_count: webhook.failure_count + 1,
          success_rate: (webhook.success_count / (webhook.success_count + webhook.failure_count + 1) * 100).toFixed(2)
        }
      });
    }

    return { success, status: response.status, responseTime, error: success ? null : responseText };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('Webhook delivery error:', error);
    
    // Log the failed delivery
    await webhookDeliveries.insert({
      webhook_id: webhook.id,
      event_type: payload.event,
      payload: JSON.stringify(payload),
      status: 'failed',
      http_status: 0,
      response_body: error.message,
      response_time_ms: responseTime,
      error_message: error.message,
      retry_count: 0,
      sent_at: new Date(),
      completed_at: new Date(),
      created_at: new Date()
    });

    // Update webhook stats
    const { webhooks } = getDatastores();
    await webhooks.update({ id: webhook.id }, {
      $set: { 
        last_failure: new Date(),
        failure_count: webhook.failure_count + 1,
        success_rate: (webhook.success_count / (webhook.success_count + webhook.failure_count + 1) * 100).toFixed(2)
      }
    });

    return { success: false, status: 0, responseTime, error: error.message };
  }
}

// Function to trigger webhook events (used by other parts of the application)
async function triggerWebhookEvent(customerId, event, data) {
  const { webhooks } = getDatastores();
  
  try {
    // Find all active webhooks for this customer that listen for this event
    const customerWebhooks = await webhooks.find({
      customer_id: customerId,
      status: 'active'
    });

    // Filter webhooks that listen for this specific event
    const matchingWebhooks = customerWebhooks.filter(webhook => {
      const events = JSON.parse(webhook.events);
      return events.includes(event);
    });

    if (matchingWebhooks.length === 0) {
      return;
    }

    const payload = {
      event,
      timestamp: new Date().toISOString(),
      data
    };

    // Send webhooks in parallel
    const promises = matchingWebhooks.map(webhook => sendWebhook(webhook, payload));
    await Promise.allSettled(promises);
  } catch (error) {
    console.error('Trigger webhook event error:', error);
  }
}

module.exports = { router, triggerWebhookEvent };