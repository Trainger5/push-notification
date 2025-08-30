const express = require('express');
const { body, validationResult } = require('express-validator');
const { getDatastores } = require('../storage/datastores');
const { requireAuth, requireRole } = require('../middleware/auth');
const { getScheduler } = require('../services/scheduler');
const { notificationLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(requireAuth, requireRole('customer'));

// Schedule a notification
router.post(
  '/schedule',
  // notificationLimiter, // TODO: Re-enable rate limiting later
  body('title').isString().notEmpty(),
  body('body').isString().notEmpty(),
  body('scheduledFor').isISO8601().toDate(),
  body('url').optional().isURL(),
  body('icon').optional().isURL(),
  body('badge').optional().isURL(),
  body('image').optional().isURL(),
  body('tag').optional().isString(),
  body('timezone').optional().isString(),
  body('data').optional().isObject(),
  body('actions').optional().isArray(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { customers } = getDatastores();
      const customer = await customers.findOne({ user_id: req.user.userId });
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      // Check if scheduled time is in the future
      const scheduledTime = new Date(req.body.scheduledFor);
      const now = new Date();
      if (scheduledTime <= now) {
        return res.status(400).json({ error: 'Scheduled time must be in the future' });
      }

      // Check if scheduled time is not too far in the future (optional limit)
      const maxFutureTime = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year
      if (scheduledTime > maxFutureTime) {
        return res.status(400).json({ error: 'Cannot schedule notifications more than 1 year in advance' });
      }

      const scheduler = getScheduler();
      const notificationData = {
        customerId: customer.id,
        title: req.body.title,
        body: req.body.body,
        url: req.body.url,
        icon: req.body.icon,
        badge: req.body.badge,
        image: req.body.image,
        tag: req.body.tag,
        data: req.body.data,
        actions: req.body.actions,
        scheduledFor: scheduledTime.toISOString(),
        timezone: req.body.timezone || 'UTC',
        created_by: req.user.userId
      };

      const scheduledNotification = await scheduler.scheduleNotification(notificationData);
      
      res.status(201).json({
        id: scheduledNotification.id,
        scheduledFor: scheduledNotification.scheduledFor,
        status: scheduledNotification.status,
        message: 'Notification scheduled successfully'
      });
    } catch (error) {
      console.error('Schedule notification error:', error);
      res.status(500).json({ error: 'Failed to schedule notification' });
    }
  }
);

// Get all scheduled notifications for customer
router.get('/list', async (req, res) => {
  try {
    const { customers } = getDatastores();
    const customer = await customers.findOne({ user_id: req.user.userId });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const scheduler = getScheduler();
    const status = req.query.status; // optional filter
    const scheduledNotifications = await scheduler.getScheduledNotifications(customer.id, status);
    
    res.json({
      notifications: scheduledNotifications,
      total: scheduledNotifications.length
    });
  } catch (error) {
    console.error('Get scheduled notifications error:', error);
    res.status(500).json({ error: 'Failed to retrieve scheduled notifications' });
  }
});

// Get specific scheduled notification
router.get('/:id', async (req, res) => {
  try {
    const { customers, scheduledNotifications } = getDatastores();
    const customer = await customers.findOne({ user_id: req.user.userId });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const notification = await scheduledNotifications.findOne({
      id: req.params.id,
      customer_id: customer.id
    });

    if (!notification) {
      return res.status(404).json({ error: 'Scheduled notification not found' });
    }

    res.json(notification);
  } catch (error) {
    console.error('Get scheduled notification error:', error);
    res.status(500).json({ error: 'Failed to retrieve scheduled notification' });
  }
});

// Update scheduled notification (only if not yet sent)
router.put(
  '/:id',
  body('title').optional().isString().notEmpty(),
  body('body').optional().isString().notEmpty(),
  body('scheduledFor').optional().isISO8601().toDate(),
  body('url').optional().isURL(),
  body('icon').optional().isURL(),
  body('badge').optional().isURL(),
  body('image').optional().isURL(),
  body('tag').optional().isString(),
  body('timezone').optional().isString(),
  body('data').optional().isObject(),
  body('actions').optional().isArray(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { customers } = getDatastores();
      const customer = await customers.findOne({ user_id: req.user.userId });
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      // If scheduledFor is being updated, validate it
      if (req.body.scheduledFor) {
        const scheduledTime = new Date(req.body.scheduledFor);
        const now = new Date();
        if (scheduledTime <= now) {
          return res.status(400).json({ error: 'Scheduled time must be in the future' });
        }
      }

      const scheduler = getScheduler();
      const updates = { ...req.body };
      if (updates.scheduledFor) {
        updates.scheduledFor = new Date(updates.scheduledFor).toISOString();
      }

      const updatedNotification = await scheduler.updateScheduledNotification(
        req.params.id,
        customer.id,
        updates
      );

      res.json({
        notification: updatedNotification,
        message: 'Scheduled notification updated successfully'
      });
    } catch (error) {
      console.error('Update scheduled notification error:', error);
      if (error.message.includes('not found') || error.message.includes('cannot be updated')) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to update scheduled notification' });
      }
    }
  }
);

// Cancel scheduled notification
router.delete('/:id', async (req, res) => {
  try {
    const { customers } = getDatastores();
    const customer = await customers.findOne({ user_id: req.user.userId });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const scheduler = getScheduler();
    const cancelledNotification = await scheduler.cancelScheduledNotification(
      req.params.id,
      customer.id
    );

    res.json({
      id: cancelledNotification.id,
      status: 'cancelled',
      message: 'Scheduled notification cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel scheduled notification error:', error);
    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to cancel scheduled notification' });
    }
  }
});

// Get scheduling statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const { customers, scheduledNotifications } = getDatastores();
    const customer = await customers.findOne({ user_id: req.user.userId });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const customerId = customer.id;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get scheduling statistics
    const totalScheduled = await scheduledNotifications.count({ customer_id: customerId });
    const pendingScheduled = await scheduledNotifications.count({ 
      customer_id: customerId, 
      status: 'scheduled',
      scheduled_for: { $gt: now.toISOString() }
    });
    const sentScheduled = await scheduledNotifications.count({ 
      customer_id: customerId, 
      status: 'sent'
    });
    const failedScheduled = await scheduledNotifications.count({ 
      customer_id: customerId, 
      status: 'failed'
    });
    const recentScheduled = await scheduledNotifications.count({
      customer_id: customerId,
      created_at: { $gte: thirtyDaysAgo.toISOString() }
    });

    // Get upcoming notifications (next 7 days)
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingNotifications = await scheduledNotifications.find({
      customer_id: customerId,
      status: 'scheduled',
      scheduled_for: { 
        $gte: now.toISOString(),
        $lte: sevenDaysFromNow.toISOString()
      }
    }, { sort: { scheduled_for: 1 }, limit: 5 });

    res.json({
      stats: {
        total: totalScheduled,
        pending: pendingScheduled,
        sent: sentScheduled,
        failed: failedScheduled,
        recent30Days: recentScheduled
      },
      upcoming: upcomingNotifications
    });
  } catch (error) {
    console.error('Get scheduling stats error:', error);
    res.status(500).json({ error: 'Failed to retrieve scheduling statistics' });
  }
});

module.exports = router;