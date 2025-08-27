const express = require('express');
const { body, validationResult } = require('express-validator');
const { getDatastores } = require('../storage/datastores');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireRole('customer'));

// Create a new segment
router.post(
  '/create',
  body('name').isString().notEmpty().isLength({ min: 1, max: 100 }),
  body('description').optional().isString().isLength({ max: 500 }),
  body('criteria').isObject(),
  body('color').optional().isString().matches(/^#[0-9A-F]{6}$/i),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { customers, userSegments } = getDatastores();
      const customer = await customers.findOne({ userId: req.user.userId });
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      // Check if segment name already exists for this customer
      const existingSegment = await userSegments.findOne({
        customerId: customer._id,
        name: req.body.name
      });
      
      if (existingSegment) {
        return res.status(409).json({ error: 'Segment with this name already exists' });
      }

      const segment = {
        customerId: customer._id,
        name: req.body.name,
        description: req.body.description || '',
        criteria: req.body.criteria,
        color: req.body.color || '#3182CE',
        isActive: true,
        subscriberCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: req.user.userId
      };

      const newSegment = await userSegments.insert(segment);
      
      // Calculate initial subscriber count
      const count = await calculateSegmentSize(customer._id, segment.criteria);
      await userSegments.update({ _id: newSegment._id }, { $set: { subscriberCount: count } });
      
      res.status(201).json({
        segment: { ...newSegment, subscriberCount: count },
        message: 'Segment created successfully'
      });
    } catch (error) {
      console.error('Create segment error:', error);
      res.status(500).json({ error: 'Failed to create segment' });
    }
  }
);

// Get all segments for customer
router.get('/list', async (req, res) => {
  try {
    const { customers, userSegments } = getDatastores();
    const customer = await customers.findOne({ userId: req.user.userId });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const segments = await userSegments.find({ customerId: customer._id }).sort({ updatedAt: -1 });
    
    // Update subscriber counts for all segments
    for (const segment of segments) {
      const count = await calculateSegmentSize(customer._id, segment.criteria);
      if (count !== segment.subscriberCount) {
        await userSegments.update(
          { _id: segment._id }, 
          { $set: { subscriberCount: count, updatedAt: new Date().toISOString() } }
        );
        segment.subscriberCount = count;
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
    const customer = await customers.findOne({ userId: req.user.userId });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const segment = await userSegments.findOne({
      _id: req.params.id,
      customerId: customer._id
    });

    if (!segment) {
      return res.status(404).json({ error: 'Segment not found' });
    }

    // Update subscriber count
    const count = await calculateSegmentSize(customer._id, segment.criteria);
    if (count !== segment.subscriberCount) {
      await userSegments.update(
        { _id: segment._id }, 
        { $set: { subscriberCount: count, updatedAt: new Date().toISOString() } }
      );
      segment.subscriberCount = count;
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
      const customer = await customers.findOne({ userId: req.user.userId });
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      const segment = await userSegments.findOne({
        _id: req.params.id,
        customerId: customer._id
      });

      if (!segment) {
        return res.status(404).json({ error: 'Segment not found' });
      }

      // If name is being changed, check for conflicts
      if (req.body.name && req.body.name !== segment.name) {
        const existingSegment = await userSegments.findOne({
          customerId: customer._id,
          name: req.body.name,
          _id: { $ne: req.params.id }
        });
        
        if (existingSegment) {
          return res.status(409).json({ error: 'Segment with this name already exists' });
        }
      }

      const updates = {
        ...req.body,
        updatedAt: new Date().toISOString()
      };

      // If criteria changed, recalculate subscriber count
      if (req.body.criteria) {
        const count = await calculateSegmentSize(customer._id, req.body.criteria);
        updates.subscriberCount = count;
      }

      await userSegments.update(
        { _id: req.params.id },
        { $set: updates }
      );

      const updatedSegment = await userSegments.findOne({ _id: req.params.id });

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
    const customer = await customers.findOne({ userId: req.user.userId });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const segment = await userSegments.findOne({
      _id: req.params.id,
      customerId: customer._id
    });

    if (!segment) {
      return res.status(404).json({ error: 'Segment not found' });
    }

    await userSegments.remove({ _id: req.params.id });

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
    const customer = await customers.findOne({ userId: req.user.userId });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const segment = await userSegments.findOne({
      _id: req.params.id,
      customerId: customer._id
    });

    if (!segment) {
      return res.status(404).json({ error: 'Segment not found' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const query = buildSegmentQuery(customer._id, segment.criteria);
    const allSubscribers = await subscriptions.find(query);
    const subscribers = allSubscribers.slice(skip, skip + limit);

    res.json({
      subscribers: subscribers.map(sub => ({
        id: sub._id,
        country: sub.country,
        city: sub.city,
        browser: sub.browser,
        os: sub.os,
        device: sub.device,
        tags: sub.tags || [],
        engagementScore: sub.engagementScore || 0,
        lastActive: sub.lastActive,
        createdAt: sub.createdAt
      })),
      total: allSubscribers.length,
      page,
      totalPages: Math.ceil(allSubscribers.length / limit)
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
      const customer = await customers.findOne({ userId: req.user.userId });
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      const segment = await userSegments.findOne({
        _id: req.params.id,
        customerId: customer._id,
        isActive: true
      });

      if (!segment) {
        return res.status(404).json({ error: 'Segment not found or inactive' });
      }

      // Get subscribers in this segment
      const query = buildSegmentQuery(customer._id, segment.criteria);
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
          customerId: customer._id,
          title: req.body.title,
          body: req.body.body,
          url: req.body.url,
          icon: req.body.icon,
          badge: req.body.badge,
          image: req.body.image,
          tag: req.body.tag,
          scheduledFor: new Date(req.body.scheduledFor).toISOString(),
          timezone: req.body.timezone || 'UTC',
          segmentId: segment._id,
          segmentName: segment.name,
          createdBy: req.user.userId
        });

        res.json({
          scheduled: true,
          scheduledNotificationId: scheduledNotification._id,
          segmentSize: segmentSubscribers.length,
          message: `Notification scheduled for ${segment.name} segment (${segmentSubscribers.length} subscribers)`
        });
      } else {
        // Send immediately
        const webpush = require('web-push');
        
        const settings = await pushSettings.findOne({ customerId: customer._id });
        if (!settings) {
          return res.status(400).json({ error: 'Push settings not found' });
        }

        // Configure web-push
        webpush.setVapidDetails(
          settings.vapidSubject || process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
          settings.vapidPublicKey || process.env.VAPID_PUBLIC_KEY,
          settings.vapidPrivateKey || process.env.VAPID_PRIVATE_KEY
        );

        const payload = {
          title: req.body.title,
          body: req.body.body,
          url: req.body.url,
          icon: req.body.icon || settings.iconUrl,
          badge: req.body.badge || settings.badgeUrl,
          image: req.body.image,
          tag: req.body.tag,
          data: { segmentId: segment._id, segmentName: segment.name }
        };

        // Send to segment subscribers
        let sent = 0;
        let failed = 0;

        for (const sub of segmentSubscribers) {
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
          title: req.body.title,
          body: req.body.body,
          url: req.body.url,
          success: sent,
          failed: failed,
          segmentId: segment._id,
          segmentName: segment.name,
          targetedSubscribers: segmentSubscribers.length,
          createdAt: new Date().toISOString()
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
async function calculateSegmentSize(customerId, criteria) {
  const { subscriptions } = getDatastores();
  const query = buildSegmentQuery(customerId, criteria);
  return await subscriptions.count(query);
}

function buildSegmentQuery(customerId, criteria) {
  const query = { customerId };

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

  if (criteria.tags && criteria.tags.length > 0) {
    query.tags = { $in: criteria.tags };
  }

  if (criteria.engagementScore) {
    if (criteria.engagementScore.min !== undefined) {
      query.engagementScore = query.engagementScore || {};
      query.engagementScore.$gte = criteria.engagementScore.min;
    }
    if (criteria.engagementScore.max !== undefined) {
      query.engagementScore = query.engagementScore || {};
      query.engagementScore.$lte = criteria.engagementScore.max;
    }
  }

  if (criteria.dateRange) {
    if (criteria.dateRange.start) {
      query.createdAt = query.createdAt || {};
      query.createdAt.$gte = criteria.dateRange.start;
    }
    if (criteria.dateRange.end) {
      query.createdAt = query.createdAt || {};
      query.createdAt.$lte = criteria.dateRange.end;
    }
  }

  return query;
}

module.exports = router;