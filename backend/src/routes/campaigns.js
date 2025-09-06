const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireRole('customer'));

// Create campaign
router.post('/create',
  body('name').isString().notEmpty().isLength({ min: 1, max: 100 }),
  body('description').optional().isString().isLength({ max: 500 }),
  body('template_id').optional().isUUID(),
  body('segment_id').optional().isUUID(),
  body('schedule_type').isIn(['immediate', 'scheduled', 'recurring']),
  body('scheduled_at').optional().isISO8601(),
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

      const campaignId = uuidv4();
      const campaign = {
        id: campaignId,
        customer_id: customer.id,
        name: req.body.name,
        description: req.body.description || '',
        template_id: req.body.template_id || null,
        segment_id: req.body.segment_id || null,
        schedule_type: req.body.schedule_type,
        scheduled_at: req.body.scheduled_at ? new Date(req.body.scheduled_at) : null,
        status: 'draft',
        created_by: req.user.user_id,
        created_at: new Date(),
        updated_at: new Date()
      };

      await query(`
        INSERT INTO campaigns 
        (id, customer_id, name, description, template_id, segment_id, schedule_type, scheduled_at, status, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        campaign.id, campaign.customer_id, campaign.name, campaign.description,
        campaign.template_id, campaign.segment_id, campaign.schedule_type, campaign.scheduled_at,
        campaign.status, campaign.created_by, campaign.created_at, campaign.updated_at
      ]);

      res.status(201).json({
        message: 'Campaign created successfully',
        campaign
      });

    } catch (error) {
      console.error('Campaign creation error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Get campaigns
router.get('/list', async (req, res) => {
  try {
    const { status } = req.query;

    // Get customer
    const [customers] = await query('SELECT * FROM customers WHERE user_id = ?', [req.user.user_id]);
    const customer = customers[0];
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    let sqlQuery = `
      SELECT c.*, cu.name as customer_name, nt.name as template_name, us.name as segment_name
      FROM campaigns c
      JOIN customers cu ON c.customer_id = cu.id
      LEFT JOIN notification_templates nt ON c.template_id = nt.id
      LEFT JOIN user_segments us ON c.segment_id = us.id
      WHERE c.customer_id = ?
    `;
    let params = [customer.id];

    if (status) {
      sqlQuery += ' AND c.status = ?';
      params.push(status);
    }

    sqlQuery += ' ORDER BY c.created_at DESC';

    const [campaigns] = await query(sqlQuery, params);

    res.json({
      campaigns,
      total: campaigns.length
    });

  } catch (error) {
    console.error('Campaigns list error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start campaign
router.post('/:id/start', async (req, res) => {
  try {
    // Get customer
    const [customers] = await query('SELECT * FROM customers WHERE user_id = ?', [req.user.user_id]);
    const customer = customers[0];
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const [campaigns] = await query(
      'SELECT * FROM campaigns WHERE id = ? AND customer_id = ?',
      [req.params.id, customer.id]
    );

    if (campaigns.length === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const campaign = campaigns[0];
    if (campaign.status !== 'draft') {
      return res.status(400).json({ error: 'Can only start draft campaigns' });
    }

    await query(
      'UPDATE campaigns SET status = "running", started_at = ?, updated_at = ? WHERE id = ?',
      [new Date(), new Date(), req.params.id]
    );

    res.json({ message: 'Campaign started successfully' });

  } catch (error) {
    console.error('Campaign start error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get campaign statistics
router.get('/:id/stats', async (req, res) => {
  try {
    // Get customer
    const [customers] = await query('SELECT * FROM customers WHERE user_id = ?', [req.user.user_id]);
    const customer = customers[0];
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const [campaigns] = await query(
      'SELECT * FROM campaigns WHERE id = ? AND customer_id = ?',
      [req.params.id, customer.id]
    );

    if (campaigns.length === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Get campaign metrics
    const [notifications] = await query(
      'SELECT COUNT(*) as count, SUM(sent_count) as sent, SUM(failed_count) as failed FROM notifications WHERE campaign_id = ?',
      [req.params.id]
    );

    const [opens] = await query(
      'SELECT COUNT(*) as count FROM metrics WHERE campaign_id = ? AND event_type = "opened"',
      [req.params.id]
    );

    const [clicks] = await query(
      'SELECT COUNT(*) as count FROM metrics WHERE campaign_id = ? AND event_type = "clicked"',
      [req.params.id]
    );

    const stats = {
      notifications_sent: notifications[0].count || 0,
      total_sent: notifications[0].sent || 0,
      total_failed: notifications[0].failed || 0,
      total_opens: opens[0].count || 0,
      total_clicks: clicks[0].count || 0,
      open_rate: notifications[0].sent > 0 ? Math.round((opens[0].count / notifications[0].sent) * 100) : 0,
      click_rate: notifications[0].sent > 0 ? Math.round((clicks[0].count / notifications[0].sent) * 100) : 0
    };

    res.json({ campaign: campaigns[0], stats });

  } catch (error) {
    console.error('Campaign stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;