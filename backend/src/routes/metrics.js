const express = require('express');
const { getDatastores } = require('../storage/datastores');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Minimal metrics collection – no auth, keyed implicitly by last notification sent.
// This is intentionally simple and does not deanonymize users.

router.post('/open', async (req, res) => {
  try {
    const { metrics } = getDatastores();
    const cid = req.query && req.query.cid ? String(req.query.cid) : null;
    const abTestId = req.query && req.query.abtestId ? String(req.query.abtestId) : null;
    const variantId = req.query && req.query.variantId ? String(req.query.variantId) : null;
    
    const metricData = { 
      event_type: 'opened', 
      customer_id: cid, 
      timestamp: new Date() 
    };
    
    if (abTestId) metricData.ab_test_id = abTestId;
    if (variantId) metricData.event_data = { variant_id: variantId };
    
    await metrics.insert(metricData);
  } catch (_) {}
  res.status(204).end();
});

router.post('/click', async (req, res) => {
  try {
    const { metrics } = getDatastores();
    const cid = req.query && req.query.cid ? String(req.query.cid) : null;
    const abTestId = req.query && req.query.abtestId ? String(req.query.abtestId) : null;
    const variantId = req.query && req.query.variantId ? String(req.query.variantId) : null;
    const action = req.query && req.query.action ? String(req.query.action) : 'default';
    
    const metricData = { 
      event_type: 'clicked', 
      customer_id: cid, 
      timestamp: new Date(),
      event_data: { action: action }
    };
    
    if (abTestId) metricData.ab_test_id = abTestId;
    if (variantId) metricData.event_data = { ...metricData.event_data, variant_id: variantId };
    
    // Parse request body for additional data
    if (req.body && typeof req.body === 'object') {
      if (req.body.customData) metricData.event_data = { ...metricData.event_data, custom_data: req.body.customData };
      if (req.body.timestamp) metricData.event_data = { ...metricData.event_data, client_timestamp: req.body.timestamp };
    }
    
    await metrics.insert(metricData);
  } catch (_) {}
  res.status(204).end();
});

router.post('/dismiss', async (req, res) => {
  try {
    const { metrics } = getDatastores();
    const cid = req.query && req.query.cid ? String(req.query.cid) : null;
    const abTestId = req.query && req.query.abtestId ? String(req.query.abtestId) : null;
    const variantId = req.query && req.query.variantId ? String(req.query.variantId) : null;
    
    const metricData = { 
      event_type: 'closed', 
      customer_id: cid, 
      timestamp: new Date() 
    };
    
    if (abTestId) metricData.ab_test_id = abTestId;
    if (variantId) metricData.event_data = { variant_id: variantId };
    
    // Parse request body for additional data
    if (req.body && typeof req.body === 'object') {
      if (req.body.timestamp) metricData.event_data = { ...metricData.event_data, client_timestamp: req.body.timestamp };
    }
    
    await metrics.insert(metricData);
  } catch (_) {}
  res.status(204).end();
});

// Customer analytics endpoints
router.use('/analytics', requireAuth, requireRole('customer'));

// Get dashboard overview metrics
router.get('/analytics/overview', async (req, res) => {
  try {
    const { customers, subscriptions, notifications, metrics } = getDatastores();
    const customer = await customers.findOne({ user_id: req.user.userId });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const customerId = customer.id;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get subscriber count and growth
    const totalSubscribers = await subscriptions.count({ customer_id: customerId });
    const newSubscribers7d = await subscriptions.count({ 
      customer_id: customerId, 
      created_at: { $gte: sevenDaysAgo }
    });
    const newSubscribers30d = await subscriptions.count({ 
      customer_id: customerId, 
      created_at: { $gte: thirtyDaysAgo }
    });

    // Get notification stats
    const totalNotifications = await notifications.count({ customer_id: customerId });
    const notifications7d = await notifications.count({ 
      customer_id: customerId, 
      created_at: { $gte: sevenDaysAgo }
    });
    const notifications30d = await notifications.count({ 
      customer_id: customerId, 
      created_at: { $gte: thirtyDaysAgo }
    });

    // Get engagement metrics
    const totalOpens = await metrics.count({ customer_id: customerId, event_type: 'opened' });
    const totalClicks = await metrics.count({ customer_id: customerId, event_type: 'clicked' });
    const opens7d = await metrics.count({ 
      customer_id: customerId, 
      event_type: 'opened', 
      timestamp: { $gte: sevenDaysAgo }
    });
    const clicks7d = await metrics.count({ 
      customer_id: customerId, 
      event_type: 'clicked', 
      timestamp: { $gte: sevenDaysAgo }
    });

    // Calculate delivery stats from notifications
    const allNotifications = await notifications.find({ customer_id: customerId });
    const totalSent = allNotifications.reduce((sum, n) => sum + (n.success || 0), 0);
    const totalFailed = allNotifications.reduce((sum, n) => sum + (n.failed || 0), 0);
    const deliveryRate = totalSent + totalFailed > 0 ? ((totalSent / (totalSent + totalFailed)) * 100).toFixed(1) : 0;
    const openRate = totalSent > 0 ? ((totalOpens / totalSent) * 100).toFixed(1) : 0;
    const clickRate = totalOpens > 0 ? ((totalClicks / totalOpens) * 100).toFixed(1) : 0;

    res.json({
      subscribers: {
        total: totalSubscribers,
        new7d: newSubscribers7d,
        new30d: newSubscribers30d
      },
      notifications: {
        total: totalNotifications,
        sent7d: notifications7d,
        sent30d: notifications30d
      },
      engagement: {
        totalOpens,
        totalClicks,
        opens7d,
        clicks7d,
        deliveryRate: parseFloat(deliveryRate),
        openRate: parseFloat(openRate),
        clickRate: parseFloat(clickRate)
      },
      delivery: {
        sent: totalSent,
        failed: totalFailed,
        rate: parseFloat(deliveryRate)
      }
    });
  } catch (error) {
    console.error('Analytics overview error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get time-series data for charts
router.get('/analytics/timeseries', async (req, res) => {
  try {
    const { customers, notifications, metrics } = getDatastores();
    const customer = await customers.findOne({ user_id: req.user.userId });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const customerId = customer.id;
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get daily notification counts
    const dailyNotifications = await notifications.find({ 
      customer_id: customerId, 
      created_at: { $gte: startDate }
    });

    // Get daily engagement metrics
    const dailyMetrics = await metrics.find({ 
      customer_id: customerId, 
      timestamp: { $gte: startDate }
    });

    // Group by date
    const dateMap = new Map();
    
    // Initialize all dates with zero values
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      dateMap.set(dateStr, {
        date: dateStr,
        notifications: 0,
        sent: 0,
        failed: 0,
        opens: 0,
        clicks: 0
      });
    }

    // Aggregate notifications
    dailyNotifications.forEach(notif => {
      const date = notif.created_at ? new Date(notif.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      if (dateMap.has(date)) {
        const day = dateMap.get(date);
        day.notifications++;
        day.sent += notif.success || 0;
        day.failed += notif.failed || 0;
      }
    });

    // Aggregate metrics
    dailyMetrics.forEach(metric => {
      const date = metric.timestamp ? new Date(metric.timestamp).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      if (dateMap.has(date)) {
        const day = dateMap.get(date);
        if (metric.event_type === 'opened') day.opens++;
        if (metric.event_type === 'clicked') day.clicks++;
      }
    });

    const timeseries = Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    res.json(timeseries);
  } catch (error) {
    console.error('Timeseries error:', error);
    res.status(500).json({ error: 'Failed to fetch timeseries data' });
  }
});

// Get subscriber demographics
router.get('/analytics/demographics', async (req, res) => {
  try {
    const { customers, subscriptions } = getDatastores();
    const customer = await customers.findOne({ user_id: req.user.userId });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const customerId = customer.id;
    const subs = await subscriptions.find({ customer_id: customerId });

    // Analyze browser/platform/device/country distribution
    const browserStats = {};
    const platformStats = {};
    const deviceStats = {};
    const countryStats = {};
    const cityStats = {};
    
    subs.forEach(sub => {
      // Browser stats (use stored data if available)
      const browser = sub.browser || (sub.userAgent ? detectBrowser(sub.userAgent) : 'Other');
      browserStats[browser] = (browserStats[browser] || 0) + 1;
      
      // Platform/OS stats
      const platform = sub.os || (sub.userAgent ? detectPlatform(sub.userAgent) : 'Other');
      platformStats[platform] = (platformStats[platform] || 0) + 1;
      
      // Device stats
      const device = sub.device || 'Unknown';
      deviceStats[device] = (deviceStats[device] || 0) + 1;
      
      // Location stats
      if (sub.country) {
        countryStats[sub.country] = (countryStats[sub.country] || 0) + 1;
      }
      if (sub.city) {
        cityStats[sub.city] = (cityStats[sub.city] || 0) + 1;
      }
    });

    function detectBrowser(ua) {
      if (ua.includes('Chrome')) return 'Chrome';
      if (ua.includes('Firefox')) return 'Firefox';
      if (ua.includes('Safari')) return 'Safari';
      if (ua.includes('Edge')) return 'Edge';
      return 'Other';
    }

    function detectPlatform(ua) {
      if (ua.includes('Windows')) return 'Windows';
      if (ua.includes('Mac')) return 'macOS';
      if (ua.includes('Linux')) return 'Linux';
      if (ua.includes('Android')) return 'Android';
      if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
      return 'Other';
    }

    // Convert to array format for charts
    const browsers = Object.entries(browserStats).map(([name, value]) => ({ name, value }));
    const platforms = Object.entries(platformStats).map(([name, value]) => ({ name, value }));
    const devices = Object.entries(deviceStats).map(([name, value]) => ({ name, value }));
    const countries = Object.entries(countryStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }));
    const cities = Object.entries(cityStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }));

    res.json({
      browsers,
      platforms,
      devices,
      countries,
      cities,
      totalSubscribers: subs.length,
      tenant: customer.name // Include tenant info
    });
  } catch (error) {
    console.error('Demographics error:', error);
    res.status(500).json({ error: 'Failed to fetch demographics' });
  }
});

// Get recent activity
router.get('/analytics/activity', async (req, res) => {
  try {
    const { customers, notifications, subscriptions, metrics } = getDatastores();
    const customer = await customers.findOne({ user_id: req.user.userId });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const customerId = customer.id;
    const limit = parseInt(req.query.limit) || 20;

    // Get recent notifications
    const recentNotifications = await notifications.find({ customer_id: customerId }, {
      sort: { created_at: -1 },
      limit: limit
    });

    // Get recent subscriptions
    const recentSubscriptions = await subscriptions.find({ customer_id: customerId }, {
      sort: { created_at: -1 },
      limit: 10
    });

    // Get recent engagement
    const recentEngagement = await metrics.find({ customer_id: customerId }, {
      sort: { timestamp: -1 },
      limit: 20
    });

    res.json({
      notifications: recentNotifications,
      subscriptions: recentSubscriptions,
      engagement: recentEngagement
    });
  } catch (error) {
    console.error('Activity error:', error);
    res.status(500).json({ error: 'Failed to fetch recent activity' });
  }
});

module.exports = router;


