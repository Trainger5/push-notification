const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { getDatastores } = require('../storage/datastores');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireRole('customer'));

// Create a new template
router.post(
  '/create',
  body('name').isString().notEmpty().isLength({ min: 1, max: 100 }),
  body('description').optional().isString().isLength({ max: 500 }),
  body('title').isString().notEmpty().isLength({ min: 1, max: 100 }),
  body('body').isString().notEmpty().isLength({ min: 1, max: 500 }),
  body('url').optional().isURL(),
  body('icon').optional().isURL(),
  body('badge').optional().isURL(),
  body('image').optional().isURL(),
  body('tag').optional().isString().isLength({ max: 50 }),
  body('category').optional().isString().isLength({ max: 50 }),
  body('variables').optional().isArray(),
  body('actions').optional().isArray(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { customers, notificationTemplates } = getDatastores();
      const customer = await customers.findOne({ user_id: req.user.user_id });
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      // Check if template name already exists for this customer
      const existingTemplate = await notificationTemplates.findOne({
        customer_id: customer.id,
        name: req.body.name
      });
      
      if (existingTemplate) {
        return res.status(409).json({ error: 'Template with this name already exists' });
      }

      const template = {
        customer_id: customer.id,
        name: req.body.name,
        description: req.body.description || '',
        category: req.body.category || 'general',
        title: req.body.title,
        body: req.body.body,
        url: req.body.url || null,
        icon_url: req.body.icon || null,
        badge_url: req.body.badge || null,
        image_url: req.body.image || null,
        tag: req.body.tag || null,
        actions: req.body.actions ? JSON.stringify(req.body.actions) : null,
        custom_data: JSON.stringify({ variables: req.body.variables || [] }),
        usage_count: 0,
        status: 'active',
        created_by: req.user.user_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const newTemplate = await notificationTemplates.insert(template);
      
      res.status(201).json({
        template: newTemplate,
        message: 'Template created successfully'
      });
    } catch (error) {
      console.error('Create template error:', error);
      res.status(500).json({ error: 'Failed to create template' });
    }
  }
);

// Get all templates for customer
router.get('/list', async (req, res) => {
  try {
    const { customers, notificationTemplates } = getDatastores();
    const customer = await customers.findOne({ user_id: req.user.user_id });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const category = req.query.category;
    const search = req.query.search;
    const active = req.query.active;

    let query = { customer_id: customer.id };
    
    if (category) {
      query.category = category;
    }
    
    if (active !== undefined) {
      query.status = active === 'true' ? 'active' : 'inactive';
    }

    let templates = await notificationTemplates.find(query, { sort: { updated_at: -1 } });

    // Normalize JSON fields for UI convenience
    templates = templates.map(t => ({
      ...t,
      actions: t.actions ? JSON.parse(t.actions) : [],
      variables: t.custom_data ? (JSON.parse(t.custom_data).variables || []) : []
    }));

    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      templates = templates.filter(template => 
        template.name.toLowerCase().includes(searchLower) ||
        template.description.toLowerCase().includes(searchLower) ||
        template.title.toLowerCase().includes(searchLower) ||
        template.body.toLowerCase().includes(searchLower)
      );
    }

    // Get unique categories
    const allTemplates = await notificationTemplates.find({ customer_id: customer.id });
    const categories = [...new Set(allTemplates.map(t => t.category))].filter(Boolean);

    res.json({
      templates,
      categories,
      total: templates.length
    });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ error: 'Failed to retrieve templates' });
  }
});

// Get specific template
router.get('/:id', async (req, res) => {
  try {
    const { customers, notificationTemplates } = getDatastores();
    const customer = await customers.findOne({ user_id: req.user.user_id });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const template = await notificationTemplates.findOne({
      id: req.params.id,
      customer_id: customer.id
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Parse JSON fields for convenience
    const parsed = {
      ...template,
      actions: template.actions ? JSON.parse(template.actions) : [],
      variables: template.custom_data ? (JSON.parse(template.custom_data).variables || []) : []
    };
    res.json(parsed);
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({ error: 'Failed to retrieve template' });
  }
});

// Update template
router.put(
  '/:id',
  body('name').optional().isString().notEmpty().isLength({ min: 1, max: 100 }),
  body('description').optional().isString().isLength({ max: 500 }),
  body('title').optional().isString().notEmpty().isLength({ min: 1, max: 100 }),
  body('body').optional().isString().notEmpty().isLength({ min: 1, max: 500 }),
  body('url').optional().isURL(),
  body('icon').optional().isURL(),
  body('badge').optional().isURL(),
  body('image').optional().isURL(),
  body('tag').optional().isString().isLength({ max: 50 }),
  body('category').optional().isString().isLength({ max: 50 }),
  body('variables').optional().isArray(),
  body('actions').optional().isArray(),
  body('isActive').optional().isBoolean(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { customers, notificationTemplates } = getDatastores();
      const customer = await customers.findOne({ user_id: req.user.user_id });
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      const template = await notificationTemplates.findOne({
        id: req.params.id,
        customer_id: customer.id
      });

      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      // If name is being changed, check for conflicts
      if (req.body.name && req.body.name !== template.name) {
        const existingTemplate = await notificationTemplates.findOne({
          customer_id: customer.id,
          name: req.body.name,
          id: { $ne: req.params.id }
        });
        
        if (existingTemplate) {
          return res.status(409).json({ error: 'Template with this name already exists' });
        }
      }

      // Normalize update fields to match DB schema
      const updates = { updated_at: new Date().toISOString() };
      if (req.body.name !== undefined) updates.name = req.body.name;
      if (req.body.description !== undefined) updates.description = req.body.description;
      if (req.body.title !== undefined) updates.title = req.body.title;
      if (req.body.body !== undefined) updates.body = req.body.body;
      if (req.body.url !== undefined) updates.url = req.body.url || null;
      if (req.body.icon !== undefined) updates.icon_url = req.body.icon || null;
      if (req.body.badge !== undefined) updates.badge_url = req.body.badge || null;
      if (req.body.image !== undefined) updates.image_url = req.body.image || null;
      if (req.body.tag !== undefined) updates.tag = req.body.tag || null;
      if (req.body.category !== undefined) updates.category = req.body.category;
      if (req.body.actions !== undefined) updates.actions = req.body.actions ? JSON.stringify(req.body.actions) : null;
      if (req.body.variables !== undefined) updates.custom_data = JSON.stringify({ variables: req.body.variables || [] });
      if (req.body.isActive !== undefined) updates.status = req.body.isActive ? 'active' : 'inactive';

      await notificationTemplates.update(
        { id: req.params.id },
        { $set: updates }
      );

      const updatedTemplate = await notificationTemplates.findOne({ id: req.params.id });

      res.json({
        template: {
          ...updatedTemplate,
          actions: updatedTemplate.actions ? JSON.parse(updatedTemplate.actions) : [],
          variables: updatedTemplate.custom_data ? (JSON.parse(updatedTemplate.custom_data).variables || []) : []
        },
        message: 'Template updated successfully'
      });
    } catch (error) {
      console.error('Update template error:', error);
      res.status(500).json({ error: 'Failed to update template' });
    }
  }
);

// Delete template
router.delete('/:id', async (req, res) => {
  try {
    const { customers, notificationTemplates } = getDatastores();
    const customer = await customers.findOne({ user_id: req.user.user_id });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const template = await notificationTemplates.findOne({
      id: req.params.id,
      customer_id: customer.id
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    await notificationTemplates.remove({ id: req.params.id });

    res.json({
      message: 'Template deleted successfully'
    });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

// Use template to send notification
router.post(
  '/:id/send',
  body('variables').optional().isObject(),
  body('scheduledFor').optional().isISO8601().toDate(),
  body('timezone').optional().isString(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { customers, notificationTemplates } = getDatastores();
      const customer = await customers.findOne({ user_id: req.user.user_id });
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      const template = await notificationTemplates.findOne({
        id: req.params.id,
        customer_id: customer.id,
        status: 'active'
      });

      if (!template) {
        return res.status(404).json({ error: 'Template not found or inactive' });
      }

      // Process template variables
      const variables = req.body.variables || {};
      let processedTitle = template.title;
      let processedBody = template.body;
      let processedUrl = template.url;

      // Replace variables in template (simple string replacement)
      const variablesList = template.custom_data ? (JSON.parse(template.custom_data).variables || []) : [];
      if (variablesList && variablesList.length > 0) {
        variablesList.forEach(varName => {
          const value = variables[varName] || `{{${varName}}}`;
          const regex = new RegExp(`{{${varName}}}`, 'g');
          processedTitle = processedTitle.replace(regex, value);
          processedBody = processedBody.replace(regex, value);
          if (processedUrl) {
            processedUrl = processedUrl.replace(regex, value);
          }
        });
      }

      // Prepare notification data
      const notificationData = {
        title: processedTitle,
        body: processedBody,
        url: processedUrl,
        icon: template.icon_url,
        badge: template.badge_url,
        image: template.image_url,
        tag: template.tag,
        actions: template.actions ? JSON.parse(template.actions) : []
      };

      // If scheduled, use scheduler
      if (req.body.scheduledFor) {
        const { getScheduler } = require('../services/scheduler');
        const scheduler = getScheduler();
        
        const scheduledNotification = await scheduler.scheduleNotification({
          customerId: customer.id,
          ...notificationData,
          scheduledFor: new Date(req.body.scheduledFor).toISOString(),
          timezone: req.body.timezone || 'UTC',
          created_by: req.user.user_id
        });

        // Increment usage count
        await notificationTemplates.update(
          { id: template.id },
          { $inc: { usage_count: 1 }, $set: { last_used: new Date().toISOString() } }
        );

        res.json({
          scheduled: true,
          scheduledNotificationId: scheduledNotification.id,
          message: 'Notification scheduled successfully using template'
        });
      } else {
        // Send immediately using existing customer notify endpoint logic
        const webpush = require('web-push');
        const { subscriptions, pushSettings, notifications } = getDatastores();

        const settings = await pushSettings.findOne({ customer_id: customer.id });
        if (!settings) {
          return res.status(400).json({ error: 'Push settings not found' });
        }

        const subs = await subscriptions.find({ customer_id: customer.id });
        if (subs.length === 0) {
          return res.status(400).json({ error: 'No subscribers found' });
        }

        // Configure web-push
        webpush.setVapidDetails(
          settings.vapid_subject || process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
          settings.vapid_public_key || process.env.VAPID_PUBLIC_KEY,
          settings.vapid_private_key || process.env.VAPID_PRIVATE_KEY
        );

        const payload = {
          title: processedTitle,
          body: processedBody,
          url: processedUrl,
          icon: notificationData.icon || settings.default_icon_url,
          badge: notificationData.badge || settings.default_badge_url,
          image: notificationData.image,
          tag: notificationData.tag,
          data: { templateId: template.id, templateName: template.name }
        };

        if (notificationData.actions) {
          payload.actions = notificationData.actions;
        }

        // Send to all subscribers
        let sent = 0;
        let failed = 0;

        for (const sub of subs) {
          try {
            // Support both flattened DB columns and older JSON structure
            const subscriptionData = sub.subscription
              ? (typeof sub.subscription === 'string' ? JSON.parse(sub.subscription) : sub.subscription)
              : null;
            const pushSubscription = subscriptionData ? {
              endpoint: subscriptionData.endpoint,
              keys: { p256dh: subscriptionData.keys.p256dh, auth: subscriptionData.keys.auth }
            } : {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh_key || sub.p256dh, auth: sub.auth_key || sub.auth }
            };

            await webpush.sendNotification(pushSubscription, JSON.stringify(payload));
            sent++;
          } catch (error) {
            failed++;
            
            // Remove invalid subscriptions
            if (error.statusCode === 410 || error.statusCode === 404) {
              await subscriptions.remove({ id: sub.id });
            }
          }
        }

        // Save notification record
        await notifications.insert({
          customer_id: customer.id,
          template_id: template.id,
          title: processedTitle,
          body: processedBody,
          url: processedUrl,
          payload: JSON.stringify({ variables }),
          sentAt: new Date().toISOString(),
          success: sent,
          failed: failed,
          status: 'sent'
        });

        // Increment usage count
        await notificationTemplates.update(
          { id: template.id },
          { $inc: { usage_count: 1 }, $set: { last_used: new Date().toISOString() } }
        );

        res.json({
          sent,
          failed,
          templateUsed: template.name,
          message: 'Notification sent successfully using template'
        });
      }
    } catch (error) {
      console.error('Send template notification error:', error);
      res.status(500).json({ error: 'Failed to send notification using template' });
    }
  }
);

// Duplicate template
router.post('/:id/duplicate', async (req, res) => {
  try {
    const { customers, notificationTemplates } = getDatastores();
    const customer = await customers.findOne({ user_id: req.user.user_id });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const template = await notificationTemplates.findOne({
      id: req.params.id,
      customer_id: customer.id
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Create copy with modified name
    const duplicatedTemplate = {
      ...template,
      name: `${template.name} (Copy)`,
      usageCount: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: req.user.user_id
    };

    delete duplicatedTemplate.id;

    const newTemplate = await notificationTemplates.insert(duplicatedTemplate);

    res.status(201).json({
      template: newTemplate,
      message: 'Template duplicated successfully'
    });
  } catch (error) {
    console.error('Duplicate template error:', error);
    res.status(500).json({ error: 'Failed to duplicate template' });
  }
});

module.exports = router;
