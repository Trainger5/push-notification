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
    await metrics.insert({ type: 'open', customerId: cid, at: new Date().toISOString() });
  } catch (_) {}
  res.status(204).end();
});

router.post('/click', async (req, res) => {
  try {
    const { metrics } = getDatastores();
    const cid = req.query && req.query.cid ? String(req.query.cid) : null;
    await metrics.insert({ type: 'click', customerId: cid, at: new Date().toISOString() });
  } catch (_) {}
  res.status(204).end();
});

// Customer analytics endpoints
router.use('/analytics', requireAuth, requireRole('customer'));

// Get dashboard overview metrics
router.get('/analytics/overview', async (req, res) => {
  try {
    const { customers, subscriptions, notifications, metrics } = getDatastores();
    const customer = await customers.findOne({ userId: req.user.userId });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const customerId = customer._id;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get subscriber count and growth
    const totalSubscribers = await subscriptions.count({ customerId });
    const newSubscribers7d = await subscriptions.count({ 
      customerId, 
      createdAt: { $gte: sevenDaysAgo.toISOString() }
    });
    const newSubscribers30d = await subscriptions.count({ 
      customerId, 
      createdAt: { $gte: thirtyDaysAgo.toISOString() }
    });

    // Get notification stats
    const totalNotifications = await notifications.count({ customerId });
    const notifications7d = await notifications.count({ 
      customerId, 
      createdAt: { $gte: sevenDaysAgo.toISOString() }
    });
    const notifications30d = await notifications.count({ 
      customerId, 
      createdAt: { $gte: thirtyDaysAgo.toISOString() }
    });

    // Get engagement metrics
    const totalOpens = await metrics.count({ customerId, type: 'open' });
    const totalClicks = await metrics.count({ customerId, type: 'click' });
    const opens7d = await metrics.count({ 
      customerId, 
      type: 'open', 
      at: { $gte: sevenDaysAgo.toISOString() }
    });
    const clicks7d = await metrics.count({ 
      customerId, 
      type: 'click', 
      at: { $gte: sevenDaysAgo.toISOString() }
    });

    // Calculate delivery stats from notifications
    const allNotifications = await notifications.find({ customerId });
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
    const customer = await customers.findOne({ userId: req.user.userId });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const customerId = customer._id;
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get daily notification counts
    const dailyNotifications = await notifications.find({ 
      customerId, 
      createdAt: { $gte: startDate.toISOString() }
    });

    // Get daily engagement metrics
    const dailyMetrics = await metrics.find({ 
      customerId, 
      at: { $gte: startDate.toISOString() }
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
      const date = notif.createdAt.split('T')[0];
      if (dateMap.has(date)) {
        const day = dateMap.get(date);
        day.notifications++;
        day.sent += notif.success || 0;
        day.failed += notif.failed || 0;
      }
    });

    // Aggregate metrics
    dailyMetrics.forEach(metric => {
      const date = metric.at.split('T')[0];
      if (dateMap.has(date)) {
        const day = dateMap.get(date);
        if (metric.type === 'open') day.opens++;
        if (metric.type === 'click') day.clicks++;
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
    const customer = await customers.findOne({ userId: req.user.userId });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const customerId = customer._id;
    const subs = await subscriptions.find({ customerId });

    // Analyze browser/platform distribution
    const browserStats = {};
    const platformStats = {};
    
    subs.forEach(sub => {
      if (sub.userAgent) {
        // Simple browser detection
        let browser = 'Other';
        if (sub.userAgent.includes('Chrome')) browser = 'Chrome';
        else if (sub.userAgent.includes('Firefox')) browser = 'Firefox';
        else if (sub.userAgent.includes('Safari')) browser = 'Safari';
        else if (sub.userAgent.includes('Edge')) browser = 'Edge';
        
        browserStats[browser] = (browserStats[browser] || 0) + 1;
        
        // Platform detection
        let platform = 'Other';
        if (sub.userAgent.includes('Windows')) platform = 'Windows';
        else if (sub.userAgent.includes('Mac')) platform = 'macOS';
        else if (sub.userAgent.includes('Linux')) platform = 'Linux';
        else if (sub.userAgent.includes('Android')) platform = 'Android';
        else if (sub.userAgent.includes('iPhone') || sub.userAgent.includes('iPad')) platform = 'iOS';
        
        platformStats[platform] = (platformStats[platform] || 0) + 1;
      }
    });

    // Convert to array format for charts
    const browsers = Object.entries(browserStats).map(([name, value]) => ({ name, value }));
    const platforms = Object.entries(platformStats).map(([name, value]) => ({ name, value }));

    res.json({
      browsers,
      platforms,
      totalSubscribers: subs.length
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
    const customer = await customers.findOne({ userId: req.user.userId });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const customerId = customer._id;
    const limit = parseInt(req.query.limit) || 20;

    // Get recent notifications
    const recentNotifications = await notifications.find({ customerId })
      .sort({ createdAt: -1 })
      .limit(limit);

    // Get recent subscriptions
    const recentSubscriptions = await subscriptions.find({ customerId })
      .sort({ createdAt: -1 })
      .limit(10);

    // Get recent engagement
    const recentEngagement = await metrics.find({ customerId })
      .sort({ at: -1 })
      .limit(20);

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


