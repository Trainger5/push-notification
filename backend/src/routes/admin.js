const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { requireAuth, requireRole } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// Rate limiting for admin endpoints
const adminRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again later.' }
});

// Apply auth and rate limiting to all admin routes
router.use(adminRateLimit);
router.use(requireAuth);
router.use(requireRole('admin'));

// Admin Dashboard Overview - Get system statistics
router.get('/overview', async (req, res) => {
  try {
    // Get counts for users, customers, and subscribers
    const [userCount] = await query('SELECT COUNT(*) as count FROM users');
    const [customerCount] = await query('SELECT COUNT(*) as count FROM customers WHERE status = ?', ['active']);
    
    // Get subscriber count from push_subscriptions
    const [subscriberCount] = await query('SELECT COUNT(*) as count FROM push_subscriptions WHERE status = "active"');
    
    // Get notification count from last 30 days
    const [notificationCount] = await query(`
      SELECT COUNT(*) as count FROM notifications 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);

    // Get geographic distribution of users
    const geoData = await query(`
      SELECT 
        COALESCE(c.country, 'Unknown') as country,
        COUNT(u.id) as user_count,
        COUNT(DISTINCT c.id) as customer_count
      FROM users u
      LEFT JOIN customers c ON u.id = c.user_id
      GROUP BY c.country
      ORDER BY user_count DESC
      LIMIT 10
    `);

    // Get recent activity - new users in last 7 days
    const [recentUsers] = await query(`
      SELECT COUNT(*) as count FROM users 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `);

    // Get notification delivery stats for last 30 days
    const deliveryStats = await query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM notifications 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY status
    `);

    // Get top customers by subscriber count
    const topCustomers = await query(`
      SELECT 
        c.name,
        c.email,
        c.company_name,
        c.country,
        c.plan,
        COUNT(ps.id) as subscriber_count
      FROM customers c
      LEFT JOIN push_subscriptions ps ON c.id = ps.customer_id AND ps.status = 'active'
      WHERE c.status = 'active'
      GROUP BY c.id
      ORDER BY subscriber_count DESC
      LIMIT 5
    `);

    res.json({
      stats: {
        totalUsers: userCount.count,
        activeCustomers: customerCount.count,
        totalSubscribers: subscriberCount.count,
        monthlyNotifications: notificationCount.count,
        weeklyNewUsers: recentUsers.count
      },
      geographic: geoData,
      deliveryStats,
      topCustomers
    });
  } catch (error) {
    console.error('Admin overview error:', error);
    res.status(500).json({ error: 'Failed to fetch admin overview data' });
  }
});

// Get all users with pagination
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    let whereClause = '';
    let params = [];
    
    if (search) {
      whereClause = 'WHERE u.email LIKE ? OR c.name LIKE ? OR c.company_name LIKE ?';
      params = [`%${search}%`, `%${search}%`, `%${search}%`];
    }

    const users = await query(`
      SELECT 
        u.id,
        u.email,
        u.role,
        u.email_verified,
        u.created_at as user_created_at,
        c.id as customer_id,
        c.name as customer_name,
        c.company_name,
        c.country,
        c.plan,
        c.status as customer_status,
        COUNT(ps.id) as subscriber_count
      FROM users u
      LEFT JOIN customers c ON u.id = c.user_id
      LEFT JOIN push_subscriptions ps ON c.id = ps.customer_id AND ps.status = 'active'
      ${whereClause}
      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    const [totalCount] = await query(`
      SELECT COUNT(DISTINCT u.id) as count
      FROM users u
      LEFT JOIN customers c ON u.id = c.user_id
      ${whereClause}
    `, params);

    res.json({
      users,
      pagination: {
        page,
        limit,
        total: totalCount.count,
        pages: Math.ceil(totalCount.count / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get all customers with details
router.get('/customers', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status || 'all';
    
    let whereClause = '';
    let params = [];
    
    if (status !== 'all') {
      whereClause = 'WHERE c.status = ?';
      params = [status];
    }

    const customers = await query(`
      SELECT 
        c.*,
        u.email as user_email,
        COUNT(ps.id) as subscriber_count,
        COUNT(n.id) as notification_count
      FROM customers c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN push_subscriptions ps ON c.id = ps.customer_id AND ps.status = 'active'
      LEFT JOIN notifications n ON c.id = n.customer_id AND n.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      ${whereClause}
      GROUP BY c.id
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    const [totalCount] = await query(`
      SELECT COUNT(*) as count FROM customers c ${whereClause}
    `, params);

    res.json({
      customers,
      pagination: {
        page,
        limit,
        total: totalCount.count,
        pages: Math.ceil(totalCount.count / limit)
      }
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Send notification to all subscribers or filtered subset
router.post('/notify', async (req, res) => {
  try {
    const { title, body, url, icon, targetType, targetValue, subscriberIds } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' });
    }

    let subscriptions = [];
    let description = '';

    switch (targetType) {
      case 'all':
        subscriptions = await query(`
          SELECT ps.*, c.name as customer_name
          FROM push_subscriptions ps
          JOIN customers c ON ps.customer_id = c.id
          WHERE ps.status = 'active' AND c.status = 'active'
        `);
        description = 'All subscribers';
        break;
        
      case 'customer':
        subscriptions = await query(`
          SELECT ps.*, c.name as customer_name
          FROM push_subscriptions ps
          JOIN customers c ON ps.customer_id = c.id
          WHERE ps.status = 'active' AND c.status = 'active' AND c.id = ?
        `, [targetValue]);
        description = `Customer: ${targetValue}`;
        break;
        
      case 'country':
        subscriptions = await query(`
          SELECT ps.*, c.name as customer_name
          FROM push_subscriptions ps
          JOIN customers c ON ps.customer_id = c.id
          WHERE ps.status = 'active' AND c.status = 'active' AND c.country = ?
        `, [targetValue]);
        description = `Country: ${targetValue}`;
        break;
        
      case 'subscribers':
        if (!subscriberIds || subscriberIds.length === 0) {
          return res.status(400).json({ error: 'No subscribers selected' });
        }
        const placeholders = subscriberIds.map(() => '?').join(',');
        subscriptions = await query(`
          SELECT ps.*, c.name as customer_name
          FROM push_subscriptions ps
          JOIN customers c ON ps.customer_id = c.id
          WHERE ps.status = 'active' AND c.status = 'active' AND ps.id IN (${placeholders})
        `, subscriberIds);
        description = `${subscriberIds.length} selected subscribers`;
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid target type' });
    }

    if (subscriptions.length === 0) {
      return res.status(400).json({ error: 'No subscribers found for the specified criteria' });
    }

    // Use existing notification service
    const webpush = require('web-push');
    
    let successCount = 0;
    let failureCount = 0;
    
    for (const subscription of subscriptions) {
      try {
        // Get VAPID keys for customer
        const vapidSettings = await query(
          'SELECT vapid_public_key, vapid_private_key, vapid_subject FROM push_settings WHERE customer_id = ?',
          [subscription.customer_id]
        );

        if (vapidSettings.length > 0) {
          const settings = vapidSettings[0];
          
          // Set VAPID details
          webpush.setVapidDetails(
            settings.vapid_subject,
            settings.vapid_public_key,
            settings.vapid_private_key
          );

          // Send notification
          const subscriptionObj = {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh_key || subscription.p256dh,
              auth: subscription.auth_key || subscription.auth
            }
          };

          const payload = JSON.stringify({
            title,
            body,
            icon: icon || null,
            url: url || null,
            timestamp: Date.now()
          });

          await webpush.sendNotification(subscriptionObj, payload);
          successCount++;
        } else {
          failureCount++;
        }
      } catch (error) {
        console.error(`Failed to send to subscription ${subscription.id}:`, error);
        failureCount++;
      }
    }

    // Log admin notification
    await query(`
      INSERT INTO notifications (id, customer_id, title, body, url, icon_url, status, sent_count, created_at, updated_at)
      VALUES (UUID(), NULL, ?, ?, ?, ?, 'sent', ?, NOW(), NOW())
    `, [
      `[ADMIN] ${title}`,
      `${body} (Target: ${description})`,
      url || null,
      icon || null,
      successCount
    ]);

    res.json({
      message: 'Admin notification sent',
      targetType,
      targetValue,
      description,
      totalSubscribers: subscriptions.length,
      successCount,
      failureCount,
      subscriberIds: targetType === 'subscribers' ? subscriberIds : undefined
    });
  } catch (error) {
    console.error('Admin notify error:', error);
    res.status(500).json({ error: 'Failed to send admin notification' });
  }
});

// Get system analytics
router.get('/analytics', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    
    // User registration trends
    const userTrends = await query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as new_users
      FROM users
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, [days]);

    // Notification trends
    const notificationTrends = await query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as notifications_sent,
        SUM(sent_count) as total_deliveries
      FROM notifications
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, [days]);

    // Subscription trends
    const subscriptionTrends = await query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as new_subscriptions
      FROM push_subscriptions
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, [days]);

    // Plan distribution
    const planDistribution = await query(`
      SELECT 
        plan,
        COUNT(*) as count
      FROM customers
      WHERE status = 'active'
      GROUP BY plan
    `);

    // Notification status breakdown
    const statusBreakdown = await query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM notifications
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY status
    `, [days]);

    res.json({
      userTrends,
      notificationTrends,
      subscriptionTrends,
      planDistribution,
      statusBreakdown,
      period: `${days} days`
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
});

// Get recent activity logs
router.get('/activity', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;

    const activities = await query(`
      SELECT 
        'user_registration' as type,
        CONCAT('New user registered: ', u.email) as description,
        u.created_at as timestamp,
        JSON_OBJECT('email', u.email, 'role', u.role) as metadata
      FROM users u
      WHERE u.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      
      UNION ALL
      
      SELECT 
        'notification_sent' as type,
        CONCAT('Notification sent: ', n.title) as description,
        n.created_at as timestamp,
        JSON_OBJECT('title', n.title, 'sent_count', n.sent_count, 'status', n.status) as metadata
      FROM notifications n
      WHERE n.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      
      UNION ALL
      
      SELECT 
        'subscription_created' as type,
        CONCAT('New subscription from ', COALESCE(c.name, 'Unknown')) as description,
        ps.subscribed_at as timestamp,
        JSON_OBJECT('customer_name', c.name, 'endpoint', SUBSTRING(ps.endpoint, 1, 50)) as metadata
      FROM push_subscriptions ps
      LEFT JOIN customers c ON ps.customer_id = c.id
      WHERE ps.subscribed_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      
      ORDER BY timestamp DESC
      LIMIT ?
    `, [limit]);

    res.json({ activities });
  } catch (error) {
    console.error('Activity logs error:', error);
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
});

// Get all subscribers for admin selection
router.get('/subscribers', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    let whereClause = 'WHERE ps.status = "active"';
    let params = [];
    
    if (search) {
      whereClause += ' AND (c.name LIKE ? OR c.country LIKE ? OR ps.endpoint LIKE ?)';
      params = [`%${search}%`, `%${search}%`, `%${search}%`];
    }

    const subscribers = await query(`
      SELECT 
        ps.id,
        ps.endpoint,
        ps.p256dh_key as p256dh,
        ps.auth_key as auth,
        ps.subscribed_at as created_at,
        c.id as customer_id,
        c.name as customer_name,
        c.country,
        ps.user_agent,
        ps.device as platform
      FROM push_subscriptions ps
      JOIN customers c ON ps.customer_id = c.id
      ${whereClause}
      ORDER BY ps.subscribed_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    const [totalCount] = await query(`
      SELECT COUNT(*) as count 
      FROM push_subscriptions ps
      JOIN customers c ON ps.customer_id = c.id
      ${whereClause}
    `, params);

    // Parse user agent to get browser info (simplified)
    const subscribersWithBrowserInfo = subscribers.map(sub => ({
      ...sub,
      browser: sub.user_agent ? (
        sub.user_agent.includes('Chrome') ? 'Chrome' :
        sub.user_agent.includes('Firefox') ? 'Firefox' :
        sub.user_agent.includes('Safari') ? 'Safari' :
        sub.user_agent.includes('Edge') ? 'Edge' : 'Unknown'
      ) : 'Unknown'
    }));

    res.json({
      subscribers: subscribersWithBrowserInfo,
      pagination: {
        page,
        limit,
        total: totalCount.count,
        pages: Math.ceil(totalCount.count / limit)
      }
    });
  } catch (error) {
    console.error('Get subscribers error:', error);
    res.status(500).json({ error: 'Failed to fetch subscribers' });
  }
});

// Update customer status
router.patch('/customers/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'suspended', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    await query(
      'UPDATE customers SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, id]
    );

    res.json({ message: 'Customer status updated successfully' });
  } catch (error) {
    console.error('Update customer status error:', error);
    res.status(500).json({ error: 'Failed to update customer status' });
  }
});

module.exports = router;
