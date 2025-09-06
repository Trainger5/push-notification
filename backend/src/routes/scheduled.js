const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
const { requireAuth, requireRole } = require('../middleware/auth');
const { SchedulerService } = require('../services/scheduler');
const { notificationLimiter } = require('../middleware/rateLimiter');

const router = express.Router();
const schedulerService = new SchedulerService();

router.use(requireAuth, requireRole('customer'));

// Create a scheduled notification
router.post('/create',
  notificationLimiter,
  body('title').isString().notEmpty().isLength({ min: 1, max: 100 }),
  body('body').isString().notEmpty().isLength({ min: 1, max: 500 }),
  body('scheduled_at').isISO8601(),
  body('template_id').optional().isUUID(),
  body('segment_id').optional().isUUID(),
  body('url').optional().isURL(),
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

      const scheduledNotificationId = uuidv4();
      const scheduledNotification = {
        id: scheduledNotificationId,
        customer_id: customer.id,
        title: req.body.title,
        body: req.body.body,
        url: req.body.url || null,
        icon: req.body.icon || null,
        template_id: req.body.template_id || null,
        segment_id: req.body.segment_id || null,
        scheduled_at: new Date(req.body.scheduled_at),
        status: 'pending',
        created_by: req.user.user_id,
        created_at: new Date(),
        updated_at: new Date()
      };

      await query(`
        INSERT INTO scheduled_notifications 
        (id, customer_id, title, body, url, icon, template_id, segment_id, scheduled_at, status, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        scheduledNotification.id, scheduledNotification.customer_id, scheduledNotification.title,
        scheduledNotification.body, scheduledNotification.url, scheduledNotification.icon,
        scheduledNotification.template_id, scheduledNotification.segment_id, scheduledNotification.scheduled_at,
        scheduledNotification.status, scheduledNotification.created_by, scheduledNotification.created_at,
        scheduledNotification.updated_at
      ]);

      res.status(201).json({
        message: 'Notification scheduled successfully',
        scheduled_notification: scheduledNotification
      });

    } catch (error) {
      console.error('Schedule notification error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Get all scheduled notifications for customer
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
      SELECT sn.*, c.name as customer_name
      FROM scheduled_notifications sn
      JOIN customers c ON sn.customer_id = c.id
      WHERE sn.customer_id = ?
    `;
    let params = [customer.id];

    if (status) {
      sqlQuery += ' AND sn.status = ?';
      params.push(status);
    }

    sqlQuery += ' ORDER BY sn.scheduled_at DESC';

    const [scheduledNotifications] = await query(sqlQuery, params);

    res.json({
      scheduled_notifications: scheduledNotifications,
      total: scheduledNotifications.length
    });

  } catch (error) {
    console.error('Scheduled notifications list error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get scheduled notification stats
router.get('/stats', async (req, res) => {
  try {
    // Get customer
    const [customers] = await query('SELECT * FROM customers WHERE user_id = ?', [req.user.user_id]);
    const customer = customers[0];
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const customer_id = customer.id;

    // Get various stats in parallel
    const [
      [totalScheduled],
      [pendingCount], 
      [sentCount],
      [failedCount],
      [upcomingNotifications]
    ] = await Promise.all([
      query('SELECT COUNT(*) as count FROM scheduled_notifications WHERE customer_id = ?', [customer_id]),
      query('SELECT COUNT(*) as count FROM scheduled_notifications WHERE customer_id = ? AND status = "pending"', [customer_id]),
      query('SELECT COUNT(*) as count FROM scheduled_notifications WHERE customer_id = ? AND status = "sent"', [customer_id]),
      query('SELECT COUNT(*) as count FROM scheduled_notifications WHERE customer_id = ? AND status = "failed"', [customer_id]),
      query('SELECT COUNT(*) as count FROM scheduled_notifications WHERE customer_id = ? AND status = "pending" AND scheduled_at > NOW()', [customer_id])
    ]);

    res.json({
      total_scheduled: totalScheduled[0].count,
      pending: pendingCount[0].count,
      sent: sentCount[0].count,
      failed: failedCount[0].count,
      upcoming: upcomingNotifications[0].count
    });

  } catch (error) {
    console.error('Scheduled notification stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cancel a scheduled notification
router.delete('/:id', async (req, res) => {
  try {
    // Get customer
    const [customers] = await query('SELECT * FROM customers WHERE user_id = ?', [req.user.user_id]);
    const customer = customers[0];
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Check if notification exists and is pending
    const [notifications] = await query(
      'SELECT * FROM scheduled_notifications WHERE id = ? AND customer_id = ?',
      [req.params.id, customer.id]
    );

    if (notifications.length === 0) {
      return res.status(404).json({ error: 'Scheduled notification not found' });
    }

    const notification = notifications[0];

    if (notification.status !== 'pending') {
      return res.status(400).json({ error: 'Can only cancel pending notifications' });
    }

    // Update status to cancelled
    await query(
      'UPDATE scheduled_notifications SET status = "cancelled", updated_at = ? WHERE id = ? AND customer_id = ?',
      [new Date(), req.params.id, customer.id]
    );

    res.json({ message: 'Scheduled notification cancelled successfully' });

  } catch (error) {
    console.error('Cancel scheduled notification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a scheduled notification
router.put('/:id',
  body('title').optional().isString().notEmpty().isLength({ min: 1, max: 100 }),
  body('body').optional().isString().notEmpty().isLength({ min: 1, max: 500 }),
  body('scheduled_at').optional().isISO8601(),
  body('url').optional().isURL(),
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

      // Check if notification exists and is pending
      const [notifications] = await query(
        'SELECT * FROM scheduled_notifications WHERE id = ? AND customer_id = ?',
        [req.params.id, customer.id]
      );

      if (notifications.length === 0) {
        return res.status(404).json({ error: 'Scheduled notification not found' });
      }

      const notification = notifications[0];

      if (notification.status !== 'pending') {
        return res.status(400).json({ error: 'Can only update pending notifications' });
      }

      // Build update query
      const updates = [];
      const params = [];

      if (req.body.title !== undefined) { updates.push('title = ?'); params.push(req.body.title); }
      if (req.body.body !== undefined) { updates.push('body = ?'); params.push(req.body.body); }
      if (req.body.url !== undefined) { updates.push('url = ?'); params.push(req.body.url); }
      if (req.body.icon !== undefined) { updates.push('icon = ?'); params.push(req.body.icon); }
      if (req.body.scheduled_at !== undefined) { 
        updates.push('scheduled_at = ?'); 
        params.push(new Date(req.body.scheduled_at)); 
      }

      updates.push('updated_at = ?');
      params.push(new Date());
      params.push(req.params.id, customer.id);

      await query(`
        UPDATE scheduled_notifications 
        SET ${updates.join(', ')} 
        WHERE id = ? AND customer_id = ?
      `, params);

      res.json({ message: 'Scheduled notification updated successfully' });

    } catch (error) {
      console.error('Update scheduled notification error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

module.exports = router;