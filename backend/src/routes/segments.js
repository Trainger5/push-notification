const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireRole('customer'));

// Create a new advanced segment
router.post(
  '/create',
  body('name').isString().notEmpty().isLength({ min: 1, max: 100 }),
  body('description').optional().isString().isLength({ max: 500 }),
  body('criteria').isObject(),
  body('color').optional().isString().matches(/^#[0-9A-F]{6}$/i),
  body('isActive').optional().isBoolean(),
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

      // Check if segment name already exists for this customer
      const [existingSegments] = await query(
        'SELECT id FROM user_segments WHERE customer_id = ? AND name = ?',
        [customer.id, req.body.name]
      );
      
      if (existingSegments.length > 0) {
        return res.status(409).json({ error: 'Segment with this name already exists' });
      }

      // Calculate initial segment size
      const matchedUsersCount = await calculateSegmentSize(customer.id, req.body.criteria);

      const segmentId = uuidv4();
      const segment = {
        id: segmentId,
        customer_id: customer.id,
        name: req.body.name,
        description: req.body.description || '',
        type: 'custom',
        conditions: JSON.stringify(req.body.criteria),
        subscriber_count: matchedUsersCount,
        color: req.body.color || '#3B82F6',
        is_active: req.body.isActive !== false,
        created_by: req.user.user_id,
        created_at: new Date(),
        updated_at: new Date()
      };

      await query(`
        INSERT INTO user_segments 
        (id, customer_id, name, description, type, conditions, subscriber_count, color, is_active, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        segment.id, segment.customer_id, segment.name, segment.description,
        segment.type, segment.conditions, segment.subscriber_count, 
        segment.color, segment.is_active, segment.created_by,
        segment.created_at, segment.updated_at
      ]);

      // Parse conditions for response
      const responseSegment = {
        ...segment,
        conditions: JSON.parse(segment.conditions)
      };

      res.status(201).json({ 
        message: 'Segment created successfully', 
        segment: responseSegment 
      });

    } catch (error) {
      console.error('Segment creation error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Get all segments for the customer
router.get('/list', async (req, res) => {
  try {
    const { search, active } = req.query;

    // Get customer
    const [customers] = await query('SELECT * FROM customers WHERE user_id = ?', [req.user.user_id]);
    const customer = customers[0];
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    let sqlQuery = 'SELECT * FROM user_segments WHERE customer_id = ?';
    let params = [customer.id];
    
    if (active !== undefined) {
      sqlQuery += ' AND is_active = ?';
      params.push(active === 'true');
    }

    if (search) {
      sqlQuery += ' AND (name LIKE ? OR description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    sqlQuery += ' ORDER BY updated_at DESC';

    const [segments] = await query(sqlQuery, params);

    // Parse JSON conditions
    const processedSegments = segments.map(segment => ({
      ...segment,
      conditions: segment.conditions ? JSON.parse(segment.conditions) : {}
    }));

    res.json({
      segments: processedSegments,
      total: segments.length
    });

  } catch (error) {
    console.error('Segments list error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a specific segment
router.get('/:id', async (req, res) => {
  try {
    // Get customer
    const [customers] = await query('SELECT * FROM customers WHERE user_id = ?', [req.user.user_id]);
    const customer = customers[0];
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const [segments] = await query(
      'SELECT * FROM user_segments WHERE id = ? AND customer_id = ?',
      [req.params.id, customer.id]
    );

    const segment = segments[0];
    if (!segment) {
      return res.status(404).json({ error: 'Segment not found' });
    }

    // Parse JSON conditions
    const processedSegment = {
      ...segment,
      conditions: segment.conditions ? JSON.parse(segment.conditions) : {}
    };

    res.json({ segment: processedSegment });

  } catch (error) {
    console.error('Segment get error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a segment
router.put(
  '/:id',
  body('name').optional().isString().notEmpty().isLength({ min: 1, max: 100 }),
  body('description').optional().isString().isLength({ max: 500 }),
  body('criteria').optional().isObject(),
  body('color').optional().isString().matches(/^#[0-9A-F]{6}$/i),
  body('isActive').optional().isBoolean(),
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

      // Check if segment exists
      const [segments] = await query(
        'SELECT * FROM user_segments WHERE id = ? AND customer_id = ?',
        [req.params.id, customer.id]
      );

      const segment = segments[0];
      if (!segment) {
        return res.status(404).json({ error: 'Segment not found' });
      }

      // Check name uniqueness if name is being updated
      if (req.body.name && req.body.name !== segment.name) {
        const [existingSegments] = await query(
          'SELECT id FROM user_segments WHERE customer_id = ? AND name = ? AND id != ?',
          [customer.id, req.body.name, req.params.id]
        );
        
        if (existingSegments.length > 0) {
          return res.status(409).json({ error: 'Segment with this name already exists' });
        }
      }

      // Build update query
      const updates = [];
      const params = [];
      
      if (req.body.name !== undefined) { updates.push('name = ?'); params.push(req.body.name); }
      if (req.body.description !== undefined) { updates.push('description = ?'); params.push(req.body.description); }
      if (req.body.color !== undefined) { updates.push('color = ?'); params.push(req.body.color); }
      if (req.body.isActive !== undefined) { updates.push('is_active = ?'); params.push(req.body.isActive); }
      
      if (req.body.criteria !== undefined) {
        updates.push('conditions = ?');
        params.push(JSON.stringify(req.body.criteria));
        
        // Recalculate segment size if criteria changed
        const newCount = await calculateSegmentSize(customer.id, req.body.criteria);
        updates.push('subscriber_count = ?');
        params.push(newCount);
      }

      updates.push('updated_at = ?');
      params.push(new Date());
      
      params.push(req.params.id, customer.id);

      await query(`
        UPDATE user_segments 
        SET ${updates.join(', ')} 
        WHERE id = ? AND customer_id = ?
      `, params);

      res.json({ message: 'Segment updated successfully' });

    } catch (error) {
      console.error('Segment update error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Delete a segment
router.delete('/:id', async (req, res) => {
  try {
    // Get customer
    const [customers] = await query('SELECT * FROM customers WHERE user_id = ?', [req.user.user_id]);
    const customer = customers[0];
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Check if segment exists
    const [segments] = await query(
      'SELECT id FROM user_segments WHERE id = ? AND customer_id = ?',
      [req.params.id, customer.id]
    );

    if (segments.length === 0) {
      return res.status(404).json({ error: 'Segment not found' });
    }

    await query(
      'DELETE FROM user_segments WHERE id = ? AND customer_id = ?',
      [req.params.id, customer.id]
    );

    res.json({ message: 'Segment deleted successfully' });

  } catch (error) {
    console.error('Segment delete error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get segment subscribers
router.get('/:id/subscribers', async (req, res) => {
  try {
    // Get customer
    const [customers] = await query('SELECT * FROM customers WHERE user_id = ?', [req.user.user_id]);
    const customer = customers[0];
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Get segment
    const [segments] = await query(
      'SELECT * FROM user_segments WHERE id = ? AND customer_id = ?',
      [req.params.id, customer.id]
    );

    const segment = segments[0];
    if (!segment) {
      return res.status(404).json({ error: 'Segment not found' });
    }

    // Parse conditions and build query
    const conditions = JSON.parse(segment.conditions);
    const subscriberQuery = buildSegmentQuery(customer.id, conditions);
    
    const [subscribers] = await query(`
      SELECT ps.*, c.name as customer_name
      FROM push_subscriptions ps
      JOIN customers c ON ps.customer_id = c.id
      WHERE ${subscriberQuery.where}
      ORDER BY ps.subscribed_at DESC
      LIMIT 1000
    `, subscriberQuery.params);

    res.json({
      segment: {
        ...segment,
        conditions: JSON.parse(segment.conditions)
      },
      subscribers,
      total: subscribers.length
    });

  } catch (error) {
    console.error('Segment subscribers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send notification to segment
router.post('/:id/notify', async (req, res) => {
  try {
    // Get customer
    const [customers] = await query('SELECT * FROM customers WHERE user_id = ?', [req.user.user_id]);
    const customer = customers[0];
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Get segment
    const [segments] = await query(
      'SELECT * FROM user_segments WHERE id = ? AND customer_id = ?',
      [req.params.id, customer.id]
    );

    const segment = segments[0];
    if (!segment) {
      return res.status(404).json({ error: 'Segment not found' });
    }

    // Get push settings
    const [settings] = await query('SELECT * FROM push_settings WHERE customer_id = ?', [customer.id]);
    if (!settings || !settings[0]) {
      return res.status(400).json({ error: 'Push notifications not configured' });
    }

    // Parse conditions and get subscribers
    const conditions = JSON.parse(segment.conditions);
    const subscriberQuery = buildSegmentQuery(customer.id, conditions);
    
    const [subscriptions] = await query(`
      SELECT ps.*
      FROM push_subscriptions ps
      JOIN customers c ON ps.customer_id = c.id
      WHERE ${subscriberQuery.where} AND ps.status = 'active'
    `, subscriberQuery.params);

    if (subscriptions.length === 0) {
      return res.json({ sent: 0, failed: 0, message: 'No active subscriptions found in segment' });
    }

    const webpush = require('web-push');
    webpush.setVapidDetails(
      settings[0].vapid_subject,
      settings[0].vapid_public_key,
      settings[0].vapid_private_key
    );

    const payload = {
      title: req.body.title,
      body: req.body.body,
      url: req.body.url || '/',
      icon: req.body.icon || '/icon.png',
      tag: req.body.tag || 'segment'
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

    // Record notification
    const notificationId = uuidv4();
    await query(`
      INSERT INTO notifications 
      (id, customer_id, segment_id, title, body, url, icon, status, sent_count, failed_count, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'sent', ?, ?, ?, ?)
    `, [
      notificationId, customer.id, segment.id, payload.title, payload.body,
      payload.url, payload.icon, sent, failed, new Date(), new Date()
    ]);

    res.json({ 
      sent, 
      failed, 
      message: `Segment notification sent successfully to ${sent} subscribers` 
    });

  } catch (error) {
    console.error('Segment notify error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Calculate segment size
async function calculateSegmentSize(customer_id, criteria) {
  try {
    const segmentQuery = buildSegmentQuery(customer_id, criteria);
    const [result] = await query(`
      SELECT COUNT(*) as count 
      FROM push_subscriptions ps 
      JOIN customers c ON ps.customer_id = c.id 
      WHERE ${segmentQuery.where}
    `, segmentQuery.params);
    return result[0].count;
  } catch (error) {
    console.error('Error calculating segment size:', error);
    return 0;
  }
}

// Build segment query based on criteria
function buildSegmentQuery(customer_id, criteria) {
  let where = 'ps.customer_id = ?';
  let params = [customer_id];

  if (criteria.country && criteria.country.length > 0) {
    where += ` AND c.country IN (${criteria.country.map(() => '?').join(',')})`;
    params.push(...criteria.country);
  }

  if (criteria.browser && criteria.browser.length > 0) {
    const browserConditions = criteria.browser.map(browser => {
      return `ps.user_agent LIKE ?`;
    }).join(' OR ');
    where += ` AND (${browserConditions})`;
    params.push(...criteria.browser.map(browser => `%${browser}%`));
  }

  if (criteria.subscriptionAge) {
    const days = parseInt(criteria.subscriptionAge);
    where += ' AND ps.subscribed_at >= DATE_SUB(NOW(), INTERVAL ? DAY)';
    params.push(days);
  }

  if (criteria.lastActivity) {
    const days = parseInt(criteria.lastActivity);
    where += ' AND ps.last_seen >= DATE_SUB(NOW(), INTERVAL ? DAY)';
    params.push(days);
  }

  if (criteria.deviceType && criteria.deviceType.length > 0) {
    where += ` AND ps.device IN (${criteria.deviceType.map(() => '?').join(',')})`;
    params.push(...criteria.deviceType);
  }

  return { where, params };
}

module.exports = router;