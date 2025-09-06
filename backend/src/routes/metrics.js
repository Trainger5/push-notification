const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Minimal metrics collection – no auth, keyed implicitly by last notification sent.
// This is intentionally simple and does not deanonymize users.

router.post('/open', async (req, res) => {
  try {
    const cid = req.query && req.query.cid ? String(req.query.cid) : null;
    const abTestId = req.query && req.query.abtestId ? String(req.query.abtestId) : null;
    const variantId = req.query && req.query.variantId ? String(req.query.variantId) : null;
    const campaignId = req.query && req.query.campaignId ? String(req.query.campaignId) : null;
    
    if (cid) {
      const metricId = uuidv4();
      const eventData = variantId ? JSON.stringify({ variant_id: variantId }) : null;
      
      await query(`
        INSERT INTO metrics (id, customer_id, event_type, ab_test_id, campaign_id, event_data, created_at)
        VALUES (?, ?, 'opened', ?, ?, ?, ?)
      `, [metricId, cid, abTestId, campaignId, eventData, new Date()]);
    }
  } catch (error) {
    console.error('Metrics open error:', error);
  }
  res.status(204).end();
});

router.post('/click', async (req, res) => {
  try {
    const cid = req.query && req.query.cid ? String(req.query.cid) : null;
    const abTestId = req.query && req.query.abtestId ? String(req.query.abtestId) : null;
    const variantId = req.query && req.query.variantId ? String(req.query.variantId) : null;
    const campaignId = req.query && req.query.campaignId ? String(req.query.campaignId) : null;
    
    if (cid) {
      const metricId = uuidv4();
      const eventData = variantId ? JSON.stringify({ variant_id: variantId }) : null;
      
      await query(`
        INSERT INTO metrics (id, customer_id, event_type, ab_test_id, campaign_id, event_data, created_at)
        VALUES (?, ?, 'clicked', ?, ?, ?, ?)
      `, [metricId, cid, abTestId, campaignId, eventData, new Date()]);
    }
  } catch (error) {
    console.error('Metrics click error:', error);
  }
  res.status(204).end();
});

router.post('/conversion', async (req, res) => {
  try {
    const cid = req.query && req.query.cid ? String(req.query.cid) : null;
    const abTestId = req.query && req.query.abtestId ? String(req.query.abtestId) : null;
    const variantId = req.query && req.query.variantId ? String(req.query.variantId) : null;
    const campaignId = req.query && req.query.campaignId ? String(req.query.campaignId) : null;
    const conversionValue = req.body && req.body.value ? parseFloat(req.body.value) : null;
    
    if (cid) {
      const metricId = uuidv4();
      const eventData = JSON.stringify({ 
        variant_id: variantId,
        conversion_value: conversionValue
      });
      
      await query(`
        INSERT INTO metrics (id, customer_id, event_type, ab_test_id, campaign_id, event_data, created_at)
        VALUES (?, ?, 'conversion', ?, ?, ?, ?)
      `, [metricId, cid, abTestId, campaignId, eventData, new Date()]);
    }
  } catch (error) {
    console.error('Metrics conversion error:', error);
  }
  res.status(204).end();
});

// Get metrics for authenticated customer
router.get('/dashboard', requireAuth, requireRole('customer'), async (req, res) => {
  try {
    // Get customer
    const [customers] = await query('SELECT * FROM customers WHERE user_id = ?', [req.user.user_id]);
    const customer = customers[0];
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const customer_id = customer.id;
    const { period = '30' } = req.query;

    // Get basic metrics
    const [totalSubscribers] = await query('SELECT COUNT(*) as count FROM push_subscriptions WHERE customer_id = ?', [customer_id]);

    const [activeSubscribers] = await query(`
      SELECT COUNT(*) as count FROM push_subscriptions 
      WHERE customer_id = ? AND status = 'active'
    `, [customer_id]);

    const [recentSubscribers] = await query(`
      SELECT COUNT(*) as count FROM push_subscriptions 
      WHERE customer_id = ? AND subscribed_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    `, [customer_id, period]);

    // Get notification metrics
    const [totalNotifications] = await query('SELECT COUNT(*) as count FROM notifications WHERE customer_id = ?', [customer_id]);

    const [recentNotifications] = await query(`
      SELECT COUNT(*) as count FROM notifications 
      WHERE customer_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    `, [customer_id, period]);

    // Get engagement metrics
    const [totalOpens] = await query('SELECT COUNT(*) as count FROM metrics WHERE customer_id = ? AND event_type = "opened"', [customer_id]);
    const [totalClicks] = await query('SELECT COUNT(*) as count FROM metrics WHERE customer_id = ? AND event_type = "clicked"', [customer_id]);

    const [recentOpens] = await query(`
      SELECT COUNT(*) as count FROM metrics 
      WHERE customer_id = ? AND event_type = 'opened' AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    `, [customer_id, period]);

    const [recentClicks] = await query(`
      SELECT COUNT(*) as count FROM metrics 
      WHERE customer_id = ? AND event_type = 'clicked' AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    `, [customer_id, period]);

    // Get recent notification performance
    const [allNotifications] = await query('SELECT * FROM notifications WHERE customer_id = ?', [customer_id]);

    const notificationMetrics = allNotifications.map(notification => {
      const opens = totalOpens[0].count;
      const clicks = totalClicks[0].count;
      const sent = notification.sent_count || 0;
      
      return {
        id: notification.id,
        title: notification.title,
        sent_count: sent,
        open_count: opens,
        click_count: clicks,
        open_rate: sent > 0 ? Math.round((opens / sent) * 100) : 0,
        click_rate: sent > 0 ? Math.round((clicks / sent) * 100) : 0,
        created_at: notification.created_at
      };
    });

    res.json({
      period: parseInt(period),
      subscribers: {
        total: totalSubscribers[0].count,
        active: activeSubscribers[0].count,
        recent: recentSubscribers[0].count
      },
      notifications: {
        total: totalNotifications[0].count,
        recent: recentNotifications[0].count
      },
      engagement: {
        total_opens: totalOpens[0].count,
        total_clicks: totalClicks[0].count,
        recent_opens: recentOpens[0].count,
        recent_clicks: recentClicks[0].count
      },
      notification_metrics: notificationMetrics.slice(-10) // Last 10 notifications
    });

  } catch (error) {
    console.error('Dashboard metrics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get detailed analytics
router.get('/analytics', requireAuth, requireRole('customer'), async (req, res) => {
  try {
    // Get customer
    const [customers] = await query('SELECT * FROM customers WHERE user_id = ?', [req.user.user_id]);
    const customer = customers[0];
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const customer_id = customer.id;
    const { start_date, end_date } = req.query;

    let dateFilter = '';
    let params = [customer_id];

    if (start_date && end_date) {
      dateFilter = ' AND created_at BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }

    // Get time series data for opens and clicks
    const [opensSeries] = await query(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM metrics 
      WHERE customer_id = ? AND event_type = 'opened'${dateFilter}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `, params);

    const [clicksSeries] = await query(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM metrics 
      WHERE customer_id = ? AND event_type = 'clicked'${dateFilter}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `, params);

    res.json({
      opens_series: opensSeries,
      clicks_series: clicksSeries
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get subscriber analytics
router.get('/subscribers', requireAuth, requireRole('customer'), async (req, res) => {
  try {
    // Get customer
    const [customers] = await query('SELECT * FROM customers WHERE user_id = ?', [req.user.user_id]);
    const customer = customers[0];
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const customer_id = customer.id;
    const [subs] = await query('SELECT * FROM push_subscriptions WHERE customer_id = ?', [customer_id]);

    // Analyze subscriber data
    const browserStats = {};
    const countryStats = {};
    const deviceStats = {};
    
    subs.forEach(sub => {
      // Browser analysis
      if (sub.user_agent) {
        const browser = sub.user_agent.includes('Chrome') ? 'Chrome' :
                       sub.user_agent.includes('Firefox') ? 'Firefox' :
                       sub.user_agent.includes('Safari') ? 'Safari' :
                       sub.user_agent.includes('Edge') ? 'Edge' : 'Other';
        browserStats[browser] = (browserStats[browser] || 0) + 1;
      }
      
      // Country analysis (from customer data)
      if (sub.country) {
        countryStats[sub.country] = (countryStats[sub.country] || 0) + 1;
      }
      
      // Device analysis
      if (sub.device) {
        deviceStats[sub.device] = (deviceStats[sub.device] || 0) + 1;
      }
    });

    // Growth over time
    const [growthData] = await query(`
      SELECT DATE(subscribed_at) as date, COUNT(*) as count
      FROM push_subscriptions 
      WHERE customer_id = ?
      GROUP BY DATE(subscribed_at)
      ORDER BY date DESC
      LIMIT 30
    `, [customer_id]);

    res.json({
      total_subscribers: subs.length,
      browser_stats: browserStats,
      country_stats: countryStats,
      device_stats: deviceStats,
      growth_data: growthData
    });

  } catch (error) {
    console.error('Subscriber analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get real-time metrics
router.get('/realtime', requireAuth, requireRole('customer'), async (req, res) => {
  try {
    // Get customer
    const [customers] = await query('SELECT * FROM customers WHERE user_id = ?', [req.user.user_id]);
    const customer = customers[0];
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const customer_id = customer.id;

    // Get recent activity (last hour)
    const [recentNotifications] = await query(`
      SELECT * FROM notifications 
      WHERE customer_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
      ORDER BY created_at DESC
    `, [customer_id]);

    const [recentSubscriptions] = await query(`
      SELECT * FROM push_subscriptions 
      WHERE customer_id = ? AND subscribed_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
      ORDER BY subscribed_at DESC
    `, [customer_id]);

    const [recentEngagement] = await query(`
      SELECT * FROM metrics 
      WHERE customer_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
      ORDER BY created_at DESC
    `, [customer_id]);

    res.json({
      recent_notifications: recentNotifications,
      recent_subscriptions: recentSubscriptions,
      recent_engagement: recentEngagement
    });

  } catch (error) {
    console.error('Real-time metrics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;