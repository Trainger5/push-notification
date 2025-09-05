const express = require('express');
const { body, validationResult } = require('express-validator');
const { getDatastores } = require('../storage/datastores');
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

      const { customers, userSegments } = getDatastores();
      const customer = await customers.findOne({ user_id: req.user.user_id });
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      // Check if segment name already exists for this customer
      const existingSegment = await userSegments.findOne({
        customer_id: customer.id,
        name: req.body.name
      });
      
      if (existingSegment) {
        return res.status(409).json({ error: 'Segment with this name already exists' });
      }

      // Calculate initial segment size
      const matchedUsersCount = await calculateSegmentSize(customer.id, req.body.criteria);

      const segment = {
        customer_id: customer.id,
        name: req.body.name,
        description: req.body.description || '',
        type: 'custom',
        conditions: JSON.stringify(req.body.criteria),
        subscriber_count: matchedUsersCount,
        is_active: req.body.isActive !== false,
        color: req.body.color || '#3182CE',
        engagement_score: 0, // Will be calculated later
        growth_rate: 0, // Will be calculated over time
        last_calculated: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
        created_by: req.user.user_id
      };

      const newSegment = await userSegments.insert(segment);
      
      res.status(201).json({
        segment: newSegment,
        message: 'Segment created successfully'
      });
    } catch (error) {
      console.error('Create segment error:', error);
      res.status(500).json({ error: 'Failed to create segment' });
    }
  }
);

// Real-time segment size calculation
router.post('/calculate', async (req, res) => {
  try {
    const { customers } = getDatastores();
    const customer = await customers.findOne({ user_id: req.user.user_id });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const { criteria } = req.body;
    const matchedUsersCount = await calculateSegmentSize(customer.id, criteria);
    
    res.json({ 
      count: matchedUsersCount,
      estimatedReach: matchedUsersCount,
      criteria: analyzeCriteria(criteria)
    });
  } catch (error) {
    console.error('Segment calculation error:', error);
    res.status(500).json({ error: 'Failed to calculate segment size' });
  }
});

// Get all segments for customer
router.get('/list', async (req, res) => {
  try {
    const { customers, userSegments } = getDatastores();
    const customer = await customers.findOne({ user_id: req.user.user_id });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const segments = await userSegments.find(
      { customer_id: customer.id }, 
      { sort: { updated_at: -1 } }
    );
    
    // Update subscriber counts for all segments
    for (const segment of segments) {
      const conditions = JSON.parse(segment.conditions);
      const count = await calculateSegmentSize(customer.id, conditions);
      if (count !== segment.subscriber_count) {
        await userSegments.update(
          { id: segment.id }, 
          { $set: { subscriber_count: count, updated_at: new Date() } }
        );
        segment.subscriber_count = count;
      }
    }

    res.json({
      segments,
      total: segments.length
    });
  } catch (error) {
    console.error('Get segments error:', error);
    res.status(500).json({ error: 'Failed to retrieve segments' });
  }
});

// Get specific segment
router.get('/:id', async (req, res) => {
  try {
    const { customers, userSegments } = getDatastores();
    const customer = await customers.findOne({ user_id: req.user.user_id });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const segment = await userSegments.findOne({
      id: req.params.id,
      customer_id: customer.id
    });

    if (!segment) {
      return res.status(404).json({ error: 'Segment not found' });
    }

    // Update subscriber count
    const conditions = JSON.parse(segment.conditions);
    const count = await calculateSegmentSize(customer.id, conditions);
    if (count !== segment.subscriber_count) {
      await userSegments.update(
        { id: segment.id }, 
        { $set: { subscriber_count: count, updated_at: new Date() } }
      );
      segment.subscriber_count = count;
    }

    res.json(segment);
  } catch (error) {
    console.error('Get segment error:', error);
    res.status(500).json({ error: 'Failed to retrieve segment' });
  }
});

// Update segment
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

      const { customers, userSegments } = getDatastores();
      const customer = await customers.findOne({ user_id: req.user.user_id });
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      const segment = await userSegments.findOne({
        id: req.params.id,
        customer_id: customer.id
      });

      if (!segment) {
        return res.status(404).json({ error: 'Segment not found' });
      }

      // If name is being changed, check for conflicts
      if (req.body.name && req.body.name !== segment.name) {
        const existingSegment = await userSegments.findOne({
          customer_id: customer.id,
          name: req.body.name,
          id: { $ne: req.params.id }
        });
        
        if (existingSegment) {
          return res.status(409).json({ error: 'Segment with this name already exists' });
        }
      }

      const updateData = {};
      
      if (req.body.name) updateData.name = req.body.name;
      if (req.body.description !== undefined) updateData.description = req.body.description;
      if (req.body.color) updateData.color = req.body.color;
      if (req.body.isActive !== undefined) updateData.is_active = req.body.isActive;
      
      // If criteria changed, recalculate subscriber count
      if (req.body.criteria) {
        updateData.conditions = JSON.stringify(req.body.criteria);
        const count = await calculateSegmentSize(customer.id, req.body.criteria);
        updateData.subscriber_count = count;
      }
      
      updateData.updated_at = new Date();

      await userSegments.update(
        { id: req.params.id },
        { $set: updateData }
      );

      const updatedSegment = await userSegments.findOne({ id: req.params.id });

      res.json({
        segment: updatedSegment,
        message: 'Segment updated successfully'
      });
    } catch (error) {
      console.error('Update segment error:', error);
      res.status(500).json({ error: 'Failed to update segment' });
    }
  }
);

// Delete segment
router.delete('/:id', async (req, res) => {
  try {
    const { customers, userSegments } = getDatastores();
    const customer = await customers.findOne({ user_id: req.user.user_id });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const segment = await userSegments.findOne({
      id: req.params.id,
      customer_id: customer.id
    });

    if (!segment) {
      return res.status(404).json({ error: 'Segment not found' });
    }

    await userSegments.remove({ id: req.params.id });

    res.json({
      message: 'Segment deleted successfully'
    });
  } catch (error) {
    console.error('Delete segment error:', error);
    res.status(500).json({ error: 'Failed to delete segment' });
  }
});

// Get subscribers in a segment
router.get('/:id/subscribers', async (req, res) => {
  try {
    const { customers, userSegments, subscriptions } = getDatastores();
    const customer = await customers.findOne({ user_id: req.user.user_id });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const segment = await userSegments.findOne({
      id: req.params.id,
      customer_id: customer.id
    });

    if (!segment) {
      return res.status(404).json({ error: 'Segment not found' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const conditions = JSON.parse(segment.conditions);
    const query = buildSegmentQuery(customer.id, conditions);
    
    // Get total count
    const totalCount = await subscriptions.count(query);
    
    // Get paginated subscribers
    const subscribers = await subscriptions.find(query, { 
      limit: limit, 
      skip: skip 
    });

    res.json({
      subscribers: subscribers.map(sub => ({
        id: sub.id,
        country: sub.country,
        city: sub.city,
        browser: sub.browser,
        os: sub.os,
        device: sub.device,
        tags: sub.tags ? JSON.parse(sub.tags) : [],
        engagement_score: sub.engagement_score || 0,
        last_active: sub.last_active,
        created_at: sub.created_at
      })),
      total: totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit)
    });
  } catch (error) {
    console.error('Get segment subscribers error:', error);
    res.status(500).json({ error: 'Failed to retrieve segment subscribers' });
  }
});

// Send notification to segment
router.post(
  '/:id/notify',
  body('title').isString().notEmpty(),
  body('body').isString().notEmpty(),
  body('url').optional().isURL(),
  body('icon').optional().isURL(),
  body('badge').optional().isURL(),
  body('image').optional().isURL(),
  body('tag').optional().isString(),
  body('scheduledFor').optional().isISO8601().toDate(),
  body('timezone').optional().isString(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { customers, userSegments, subscriptions, pushSettings, notifications } = getDatastores();
      const customer = await customers.findOne({ user_id: req.user.user_id });
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      const segment = await userSegments.findOne({
        id: req.params.id,
        customer_id: customer.id,
        is_active: true
      });

      if (!segment) {
        return res.status(404).json({ error: 'Segment not found or inactive' });
      }

      // Get subscribers in this segment
      const conditions = JSON.parse(segment.conditions);
      const query = buildSegmentQuery(customer.id, conditions);
      const segmentSubscribers = await subscriptions.find(query);

      if (segmentSubscribers.length === 0) {
        return res.status(400).json({ error: 'No subscribers found in this segment' });
      }

      // If scheduled, use scheduler
      if (req.body.scheduledFor) {
        const { getScheduler } = require('../services/scheduler');
        const scheduler = getScheduler();
        
        // Create a special notification record for segments
        const scheduledNotification = await scheduler.scheduleNotification({
          customer_id: customer.id,
          title: req.body.title,
          body: req.body.body,
          url: req.body.url,
          icon: req.body.icon,
          badge: req.body.badge,
          image: req.body.image,
          tag: req.body.tag,
          scheduledFor: new Date(req.body.scheduledFor).toISOString(),
          timezone: req.body.timezone || 'UTC',
          segmentId: segment.id,
          segmentName: segment.name,
          created_by: req.user.user_id
        });

        res.json({
          scheduled: true,
          scheduledNotificationId: scheduledNotification.id,
          segmentSize: segmentSubscribers.length,
          message: `Notification scheduled for ${segment.name} segment (${segmentSubscribers.length} subscribers)`
        });
      } else {
        // Send immediately
        const webpush = require('web-push');
        
        const settings = await pushSettings.findOne({ customer_id: customer.id });
        if (!settings) {
          return res.status(400).json({ error: 'Push settings not found' });
        }

        // Configure web-push
        webpush.setVapidDetails(
          settings.vapid_subject || process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
          settings.vapid_public_key || process.env.VAPID_PUBLIC_KEY,
          settings.vapid_private_key || process.env.VAPID_PRIVATE_KEY
        );

        const payload = {
          title: req.body.title,
          body: req.body.body,
          url: req.body.url,
          icon: req.body.icon || settings.default_icon_url,
          badge: req.body.badge || settings.default_badge_url,
          image: req.body.image,
          tag: req.body.tag,
          data: { segmentId: segment.id, segmentName: segment.name }
        };

        // Send to segment subscribers
        let sent = 0;
        let failed = 0;
        const results = [];

        for (const sub of segmentSubscribers) {
          try {
            const subscriptionData = sub.subscription
              ? (typeof sub.subscription === 'string' ? JSON.parse(sub.subscription) : sub.subscription)
              : null;
            const pushSubscription = subscriptionData ? {
              endpoint: subscriptionData.endpoint,
              keys: {
                p256dh: subscriptionData.keys.p256dh,
                auth: subscriptionData.keys.auth
              }
            } : {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh_key || sub.p256dh,
                auth: sub.auth_key || sub.auth
              }
            };

            await webpush.sendNotification(pushSubscription, JSON.stringify(payload));
            sent++;
            results.push({ endpoint: subscriptionData.endpoint, status: 'sent' });
          } catch (error) {
            failed++;
            results.push({ 
              endpoint: (subscriptionData && subscriptionData.endpoint) || sub.endpoint, 
              status: 'failed', 
              error: error.message 
            });
            
            // Remove invalid subscriptions
            if (error.statusCode === 410 || error.statusCode === 404) {
              await subscriptions.remove({ id: sub.id });
            }
          }
        }

        // Save notification record
        await notifications.insert({
          customer_id: customer.id,
          title: req.body.title,
          body: req.body.body,
          url: req.body.url,
          success_count: sent,
          failure_count: failed,
          segment_id: segment.id,
          segment_name: segment.name,
          targeted_subscribers: segmentSubscribers.length,
          created_at: new Date(),
          delivery_results: JSON.stringify(results)
        });

        res.json({
          sent,
          failed,
          segmentName: segment.name,
          targetedSubscribers: segmentSubscribers.length,
          message: `Notification sent to ${segment.name} segment`
        });
      }
    } catch (error) {
      console.error('Send segment notification error:', error);
      res.status(500).json({ error: 'Failed to send notification to segment' });
    }
  }
);

// Helper functions
async function calculateSegmentSize(customer_id, criteria) {
  const { subscriptions } = getDatastores();
  const query = buildSegmentQuery(customer_id, criteria);
  return await subscriptions.count(query);
}

function buildSegmentQuery(customer_id, criteria) {
  const query = { customer_id: customer_id };

  if (criteria.countries && criteria.countries.length > 0) {
    query.country = { $in: criteria.countries };
  }

  if (criteria.cities && criteria.cities.length > 0) {
    query.city = { $in: criteria.cities };
  }

  if (criteria.browsers && criteria.browsers.length > 0) {
    query.browser = { $in: criteria.browsers };
  }

  if (criteria.os && criteria.os.length > 0) {
    query.os = { $in: criteria.os };
  }

  if (criteria.devices && criteria.devices.length > 0) {
    query.device = { $in: criteria.devices };
  }

  if (criteria.engagementScore) {
    if (criteria.engagementScore.min !== undefined) {
      query.engagement_score = query.engagement_score || {};
      query.engagement_score.$gte = criteria.engagementScore.min;
    }
    if (criteria.engagementScore.max !== undefined) {
      query.engagement_score = query.engagement_score || {};
      query.engagement_score.$lte = criteria.engagementScore.max;
    }
  }

  if (criteria.dateRange) {
    if (criteria.dateRange.start) {
      query.created_at = query.created_at || {};
      query.created_at.$gte = criteria.dateRange.start;
    }
    if (criteria.dateRange.end) {
      query.created_at = query.created_at || {};
      query.created_at.$lte = criteria.dateRange.end;
    }
  }

  return query;
}

// Analyze criteria to provide UI insights
function analyzeCriteria(criteria) {
  const counts = {
    location: 0,
    device: 0,
    behavior: 0,
    time: 0,
    advanced: 0
  };

  // Count location filters
  if (criteria.countries?.length) counts.location++;
  if (criteria.cities?.length) counts.location++;
  if (criteria.regions?.length) counts.location++;
  if (criteria.timezone) counts.location++;

  // Count device filters
  if (criteria.browsers?.length) counts.device++;
  if (criteria.os?.length) counts.device++;
  if (criteria.devices?.length) counts.device++;

  // Count behavior filters
  if (criteria.engagementScore && (criteria.engagementScore.min > 0 || criteria.engagementScore.max < 100)) {
    counts.behavior++;
  }
  if (criteria.lastSeen) counts.behavior++;
  if (criteria.notificationOpens && (criteria.notificationOpens.min > 0 || criteria.notificationOpens.max < 1000)) {
    counts.behavior++;
  }
  if (criteria.notificationClicks && (criteria.notificationClicks.min > 0 || criteria.notificationClicks.max < 1000)) {
    counts.behavior++;
  }
  if (criteria.subscriptionDate && (criteria.subscriptionDate.start || criteria.subscriptionDate.end)) {
    counts.behavior++;
  }

  // Count time filters
  if (criteria.activeHours && (criteria.activeHours.start !== 9 || criteria.activeHours.end !== 17)) {
    counts.time++;
  }
  if (criteria.weekdays && criteria.weekdays.length < 7) counts.time++;

  // Count advanced filters
  if (criteria.customTags?.length) counts.advanced++;
  if (criteria.abTestParticipant) counts.advanced++;
  if (criteria.highValueUser) counts.advanced++;
  if (criteria.recentlyActive) counts.advanced++;

  return counts;
}

module.exports = router;
