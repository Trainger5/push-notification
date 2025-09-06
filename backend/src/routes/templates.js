const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
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

      // Get customer
      const [customers] = await query('SELECT * FROM customers WHERE user_id = ?', [req.user.user_id]);
      const customer = customers && customers.length > 0 ? customers[0] : null;
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      // Check if template name already exists for this customer
      const [existingTemplates] = await query(
        'SELECT id FROM notification_templates WHERE customer_id = ? AND name = ?',
        [customer.id, req.body.name]
      );
      
      if (existingTemplates && existingTemplates.length > 0) {
        return res.status(409).json({ error: 'Template with this name already exists' });
      }

      const templateId = uuidv4();
      const template = {
        id: templateId,
        customer_id: customer.id,
        name: req.body.name,
        description: req.body.description || null,
        category: req.body.category || 'general',
        title: req.body.title,
        body: req.body.body,
        url: req.body.url || null,
        icon_url: req.body.icon || null,
        badge_url: req.body.badge || null,
        image_url: req.body.image || null,
        tag: req.body.tag || null,
        actions: req.body.actions ? JSON.stringify(req.body.actions) : null,
        custom_data: req.body.variables ? JSON.stringify({ variables: req.body.variables }) : null,
        status: 'active',
        created_by: req.user.user_id,
        created_at: new Date(),
        updated_at: new Date()
      };

      await query(`
        INSERT INTO notification_templates 
        (id, customer_id, name, description, category, title, body, url, icon_url, badge_url, image_url, tag, actions, custom_data, status, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        template.id, template.customer_id, template.name, template.description, 
        template.category, template.title, template.body, template.url, 
        template.icon_url, template.badge_url, template.image_url, template.tag,
        template.actions, template.custom_data, template.status, template.created_by,
        template.created_at, template.updated_at
      ]);

      res.status(201).json({ message: 'Template created successfully', template });
    } catch (error) {
      console.error('Template creation error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Get all templates for the customer
router.get('/list', async (req, res) => {
  try {
    const { category, search, active } = req.query;

    // Get customer
    const [customers] = await query('SELECT * FROM customers WHERE user_id = ?', [req.user.user_id]);
    const customer = customers[0];
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    let sqlQuery = 'SELECT * FROM notification_templates WHERE customer_id = ?';
    let params = [customer.id];
    
    if (category) {
      sqlQuery += ' AND category = ?';
      params.push(category);
    }
    
    if (active !== undefined) {
      const status = active === 'true' ? 'active' : 'inactive';
      sqlQuery += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      sqlQuery += ' AND (name LIKE ? OR description LIKE ? OR title LIKE ? OR body LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    sqlQuery += ' ORDER BY updated_at DESC';

    const [templates] = await query(sqlQuery, params);

    // Get unique categories
    const [categoryResults] = await query(
      'SELECT DISTINCT category FROM notification_templates WHERE customer_id = ? AND category IS NOT NULL',
      [customer.id]
    );
    const categories = categoryResults.map(row => row.category);

    // Parse JSON fields
    const processedTemplates = templates.map(template => ({
      ...template,
      actions: template.actions ? JSON.parse(template.actions) : null,
      custom_data: template.custom_data ? JSON.parse(template.custom_data) : null,
      variables: template.custom_data ? JSON.parse(template.custom_data)?.variables : null
    }));

    res.json({
      templates: processedTemplates,
      categories,
      total: templates.length
    });
  } catch (error) {
    console.error('Template list error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a specific template
router.get('/:id', async (req, res) => {
  try {
    // Get customer
    const [customers] = await query('SELECT * FROM customers WHERE user_id = ?', [req.user.user_id]);
    const customer = customers[0];
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const [templates] = await query(
      'SELECT * FROM notification_templates WHERE id = ? AND customer_id = ?',
      [req.params.id, customer.id]
    );

    const template = templates[0];
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Parse JSON fields
    const processedTemplate = {
      ...template,
      actions: template.actions ? JSON.parse(template.actions) : null,
      custom_data: template.custom_data ? JSON.parse(template.custom_data) : null,
      variables: template.custom_data ? JSON.parse(template.custom_data)?.variables : null
    };

    res.json({ template: processedTemplate });
  } catch (error) {
    console.error('Template get error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a template
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
  body('status').optional().isIn(['active', 'inactive', 'archived']),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Get customer
      const [customers] = await query('SELECT * FROM customers WHERE user_id = ?', [req.user.user_id]);
      const customer = customers && customers.length > 0 ? customers[0] : null;
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      // Check if template exists
      const [templates] = await query(
        'SELECT * FROM notification_templates WHERE id = ? AND customer_id = ?',
        [req.params.id, customer.id]
      );

      const template = templates[0];
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      // Check name uniqueness if name is being updated
      if (req.body.name && req.body.name !== template.name) {
        const [existingTemplates] = await query(
          'SELECT id FROM notification_templates WHERE customer_id = ? AND name = ? AND id != ?',
          [customer.id, req.body.name, req.params.id]
        );
        
        if (existingTemplates && existingTemplates.length > 0) {
          return res.status(409).json({ error: 'Template with this name already exists' });
        }
      }

      // Build update query
      const updates = [];
      const params = [];
      
      if (req.body.name !== undefined) { updates.push('name = ?'); params.push(req.body.name); }
      if (req.body.description !== undefined) { updates.push('description = ?'); params.push(req.body.description); }
      if (req.body.category !== undefined) { updates.push('category = ?'); params.push(req.body.category); }
      if (req.body.title !== undefined) { updates.push('title = ?'); params.push(req.body.title); }
      if (req.body.body !== undefined) { updates.push('body = ?'); params.push(req.body.body); }
      if (req.body.url !== undefined) { updates.push('url = ?'); params.push(req.body.url); }
      if (req.body.icon !== undefined) { updates.push('icon_url = ?'); params.push(req.body.icon); }
      if (req.body.badge !== undefined) { updates.push('badge_url = ?'); params.push(req.body.badge); }
      if (req.body.image !== undefined) { updates.push('image_url = ?'); params.push(req.body.image); }
      if (req.body.tag !== undefined) { updates.push('tag = ?'); params.push(req.body.tag); }
      if (req.body.status !== undefined) { updates.push('status = ?'); params.push(req.body.status); }
      
      if (req.body.actions !== undefined) { 
        updates.push('actions = ?'); 
        params.push(req.body.actions ? JSON.stringify(req.body.actions) : null); 
      }
      
      if (req.body.variables !== undefined) { 
        updates.push('custom_data = ?'); 
        params.push(req.body.variables ? JSON.stringify({ variables: req.body.variables }) : null); 
      }

      updates.push('updated_at = ?');
      params.push(new Date());
      
      params.push(req.params.id, customer.id);

      await query(`
        UPDATE notification_templates 
        SET ${updates.join(', ')} 
        WHERE id = ? AND customer_id = ?
      `, params);

      res.json({ message: 'Template updated successfully' });
    } catch (error) {
      console.error('Template update error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Delete a template
router.delete('/:id', async (req, res) => {
  try {
    // Get customer
    const [customers] = await query('SELECT * FROM customers WHERE user_id = ?', [req.user.user_id]);
    const customer = customers[0];
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Check if template exists
    const [templates] = await query(
      'SELECT id FROM notification_templates WHERE id = ? AND customer_id = ?',
      [req.params.id, customer.id]
    );

    if (!templates || templates.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    await query(
      'DELETE FROM notification_templates WHERE id = ? AND customer_id = ?',
      [req.params.id, customer.id]
    );

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Template delete error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send notification using template
router.post('/:id/send', async (req, res) => {
  try {
    // Get customer
    const [customers] = await query('SELECT * FROM customers WHERE user_id = ?', [req.user.user_id]);
    const customer = customers[0];
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Get template
    const [templates] = await query(
      'SELECT * FROM notification_templates WHERE id = ? AND customer_id = ?',
      [req.params.id, customer.id]
    );

    const template = templates[0];
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Get push settings
    const [settings] = await query('SELECT * FROM push_settings WHERE customer_id = ?', [customer.id]);
    if (!settings || !settings[0]) {
      return res.status(400).json({ error: 'Push notifications not configured' });
    }

    // Get active subscriptions
    const [subscriptions] = await query(
      'SELECT * FROM push_subscriptions WHERE customer_id = ? AND status = "active"',
      [customer.id]
    );

    if (subscriptions.length === 0) {
      return res.json({ sent: 0, failed: 0, message: 'No active subscriptions found' });
    }

    const webpush = require('web-push');
    webpush.setVapidDetails(
      settings[0].vapid_subject,
      settings[0].vapid_public_key,
      settings[0].vapid_private_key
    );

    // Parse template data and apply variables if provided
    let title = template.title;
    let body = template.body;
    let url = template.url;

    // Apply variable substitution if variables provided
    if (req.body.variables && template.custom_data) {
      const templateData = JSON.parse(template.custom_data);
      if (templateData.variables) {
        Object.keys(req.body.variables).forEach(key => {
          const value = req.body.variables[key];
          title = title.replace(new RegExp(`{{${key}}}`, 'g'), value);
          body = body.replace(new RegExp(`{{${key}}}`, 'g'), value);
          if (url) url = url.replace(new RegExp(`{{${key}}}`, 'g'), value);
        });
      }
    }

    const payload = {
      title,
      body,
      url: url || '/',
      icon: template.icon_url,
      badge: template.badge_url,
      image: template.image_url,
      tag: template.tag,
      actions: template.actions ? JSON.parse(template.actions) : undefined
    };

    let sent = 0;
    let failed = 0;

    // Send notifications
    await Promise.all(subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh_key,
            auth: subscription.auth_key
          }
        }, JSON.stringify(payload));
        sent++;
      } catch (error) {
        console.error('Failed to send notification:', error);
        failed++;
      }
    }));

    // Update template usage
    await query(
      'UPDATE notification_templates SET usage_count = usage_count + 1, last_used = ? WHERE id = ?',
      [new Date(), template.id]
    );

    // Record notification
    const notificationId = uuidv4();
    await query(`
      INSERT INTO notifications 
      (id, customer_id, template_id, title, body, url, icon, status, sent_count, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'sent', ?, ?, ?)
    `, [
      notificationId, customer.id, template.id, title, body, url || '', 
      template.icon_url || '', sent, new Date(), new Date()
    ]);

    res.json({ 
      sent, 
      failed, 
      message: `Template notification sent successfully to ${sent} subscribers` 
    });

  } catch (error) {
    console.error('Template send error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;