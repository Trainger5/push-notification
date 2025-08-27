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
      const customer = await customers.findOne({ userId: req.user.userId });
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      // Check if template name already exists for this customer
      const existingTemplate = await notificationTemplates.findOne({
        customerId: customer._id,
        name: req.body.name
      });
      
      if (existingTemplate) {
        return res.status(409).json({ error: 'Template with this name already exists' });
      }

      const template = {
        customerId: customer._id,
        name: req.body.name,
        description: req.body.description || '',
        title: req.body.title,
        body: req.body.body,
        url: req.body.url,
        icon: req.body.icon,
        badge: req.body.badge,
        image: req.body.image,
        tag: req.body.tag,
        category: req.body.category || 'general',
        variables: req.body.variables || [], // Array of variable names like ['userName', 'productName']
        actions: req.body.actions || [],
        usageCount: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: req.user.userId
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
    const customer = await customers.findOne({ userId: req.user.userId });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const category = req.query.category;
    const search = req.query.search;
    const active = req.query.active;

    let query = { customerId: customer._id };
    
    if (category) {
      query.category = category;
    }
    
    if (active !== undefined) {
      query.isActive = active === 'true';
    }

    let templates = await notificationTemplates.find(query).sort({ updatedAt: -1 });

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
    const allTemplates = await notificationTemplates.find({ customerId: customer._id });
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
    const customer = await customers.findOne({ userId: req.user.userId });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const template = await notificationTemplates.findOne({
      _id: req.params.id,
      customerId: customer._id
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(template);
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
      const customer = await customers.findOne({ userId: req.user.userId });
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      const template = await notificationTemplates.findOne({
        _id: req.params.id,
        customerId: customer._id
      });

      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      // If name is being changed, check for conflicts
      if (req.body.name && req.body.name !== template.name) {
        const existingTemplate = await notificationTemplates.findOne({
          customerId: customer._id,
          name: req.body.name,
          _id: { $ne: req.params.id }
        });
        
        if (existingTemplate) {
          return res.status(409).json({ error: 'Template with this name already exists' });
        }
      }

      const updates = {
        ...req.body,
        updatedAt: new Date().toISOString()
      };

      await notificationTemplates.update(
        { _id: req.params.id },
        { $set: updates }
      );

      const updatedTemplate = await notificationTemplates.findOne({ _id: req.params.id });

      res.json({
        template: updatedTemplate,
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
    const customer = await customers.findOne({ userId: req.user.userId });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const template = await notificationTemplates.findOne({
      _id: req.params.id,
      customerId: customer._id
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    await notificationTemplates.remove({ _id: req.params.id });

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
      const customer = await customers.findOne({ userId: req.user.userId });
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      const template = await notificationTemplates.findOne({
        _id: req.params.id,
        customerId: customer._id,
        isActive: true
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
      if (template.variables && template.variables.length > 0) {
        template.variables.forEach(varName => {
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
        icon: template.icon,
        badge: template.badge,
        image: template.image,
        tag: template.tag,
        actions: template.actions,
        templateId: template._id,
        templateName: template.name
      };

      // If scheduled, use scheduler
      if (req.body.scheduledFor) {
        const { getScheduler } = require('../services/scheduler');
        const scheduler = getScheduler();
        
        const scheduledNotification = await scheduler.scheduleNotification({
          customerId: customer._id,
          ...notificationData,
          scheduledFor: new Date(req.body.scheduledFor).toISOString(),
          timezone: req.body.timezone || 'UTC',
          createdBy: req.user.userId
        });

        // Increment usage count
        await notificationTemplates.update(
          { _id: template._id },
          { $inc: { usageCount: 1 }, $set: { lastUsedAt: new Date().toISOString() } }
        );

        res.json({
          scheduled: true,
          scheduledNotificationId: scheduledNotification._id,
          message: 'Notification scheduled successfully using template'
        });
      } else {
        // Send immediately using existing customer notify endpoint logic
        const webpush = require('web-push');
        const { subscriptions, pushSettings, notifications } = getDatastores();

        const settings = await pushSettings.findOne({ customerId: customer._id });
        if (!settings) {
          return res.status(400).json({ error: 'Push settings not found' });
        }

        const subs = await subscriptions.find({ customerId: customer._id });
        if (subs.length === 0) {
          return res.status(400).json({ error: 'No subscribers found' });
        }

        // Configure web-push
        webpush.setVapidDetails(
          settings.vapidSubject || process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
          settings.vapidPublicKey || process.env.VAPID_PUBLIC_KEY,
          settings.vapidPrivateKey || process.env.VAPID_PRIVATE_KEY
        );

        const payload = {
          title: processedTitle,
          body: processedBody,
          url: processedUrl,
          icon: notificationData.icon || settings.iconUrl,
          badge: notificationData.badge || settings.badgeUrl,
          image: notificationData.image,
          tag: notificationData.tag,
          data: { templateId: template._id, templateName: template.name }
        };

        if (notificationData.actions) {
          payload.actions = notificationData.actions;
        }

        // Send to all subscribers
        let sent = 0;
        let failed = 0;

        for (const sub of subs) {
          try {
            const pushSubscription = {
              endpoint: sub.subscription.endpoint,
              keys: {
                p256dh: sub.subscription.keys.p256dh,
                auth: sub.subscription.keys.auth
              }
            };

            await webpush.sendNotification(pushSubscription, JSON.stringify(payload));
            sent++;
          } catch (error) {
            failed++;
            
            // Remove invalid subscriptions
            if (error.statusCode === 410 || error.statusCode === 404) {
              await subscriptions.remove({ _id: sub._id });
            }
          }
        }

        // Save notification record
        await notifications.insert({
          customerId: customer._id,
          title: processedTitle,
          body: processedBody,
          url: processedUrl,
          success: sent,
          failed: failed,
          templateId: template._id,
          templateName: template.name,
          variables: variables,
          createdAt: new Date().toISOString()
        });

        // Increment usage count
        await notificationTemplates.update(
          { _id: template._id },
          { $inc: { usageCount: 1 }, $set: { lastUsedAt: new Date().toISOString() } }
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
    const customer = await customers.findOne({ userId: req.user.userId });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const template = await notificationTemplates.findOne({
      _id: req.params.id,
      customerId: customer._id
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Create copy with modified name
    const duplicatedTemplate = {
      ...template,
      name: `${template.name} (Copy)`,
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: req.user.userId
    };

    delete duplicatedTemplate._id;

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