const { query } = require('../config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

class DataSeeder {
  constructor() {
    this.adminUserId = uuidv4();
    this.adminCustomerId = uuidv4();
    this.demoCustomerId = uuidv4();
    this.demoUserId = uuidv4();
  }

  async seed() {
    console.log('🌱 Starting database seeding...');

    try {
      // Check if data already exists
      const existingUsers = await query('SELECT COUNT(*) as count FROM users');
      if (existingUsers[0].count > 1) {
        console.log('⏭️  Database already seeded, skipping...');
        return;
      }

      await this.seedUsers();
      await this.seedCustomers();
      await this.seedPushSettings();
      await this.seedNotificationTemplates();
      await this.seedUserSegments();
      await this.seedSampleNotifications();
      await this.seedWebhooks();
      await this.seedCampaigns();

      console.log('✅ Database seeding completed successfully!');
    } catch (error) {
      console.error('❌ Database seeding failed:', error);
      throw error;
    }
  }

  async seedUsers() {
    console.log('👤 Seeding users...');

    const adminPassword = await bcrypt.hash('admin123', 12);
    const demoPassword = await bcrypt.hash('demo123', 12);

    const users = [
      {
        id: this.adminUserId,
        email: 'admin@notifypro.com',
        password_hash: adminPassword,
        role: 'admin',
        email_verified: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: this.demoUserId,
        email: 'demo@example.com',
        password_hash: demoPassword,
        role: 'customer',
        email_verified: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    for (const user of users) {
      await query(
        `INSERT INTO users (id, email, password_hash, role, email_verified, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [user.id, user.email, user.password_hash, user.role, user.email_verified, user.created_at, user.updated_at]
      );
    }

    console.log('✅ Users seeded');
  }

  async seedCustomers() {
    console.log('🏢 Seeding customers...');

    const customers = [
      {
        id: this.adminCustomerId,
        user_id: this.adminUserId,
        name: 'NotifyPro Admin',
        email: 'admin@notifypro.com',
        company_name: 'NotifyPro',
        industry: 'Technology',
        country: 'US',
        timezone: 'America/New_York',
        plan: 'enterprise',
        status: 'active',
        subscriber_limit: 1000000,
        monthly_quota: 1000000,
        quota_used: 0,
        quota_reset_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
        billing_email: 'billing@notifypro.com',
        api_key: this.generateApiKey(),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: this.demoCustomerId,
        user_id: this.demoUserId,
        name: 'Demo Company',
        email: 'demo@example.com',
        company_name: 'Demo Corp',
        industry: 'E-commerce',
        country: 'US',
        timezone: 'America/Los_Angeles',
        plan: 'pro',
        status: 'active',
        subscriber_limit: 10000,
        monthly_quota: 50000,
        quota_used: 1250,
        quota_reset_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
        billing_email: 'billing@example.com',
        api_key: this.generateApiKey(),
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    for (const customer of customers) {
      const columns = Object.keys(customer).join(', ');
      const placeholders = Object.keys(customer).map(() => '?').join(', ');
      const values = Object.values(customer);

      await query(
        `INSERT INTO customers (${columns}) VALUES (${placeholders})`,
        values
      );
    }

    console.log('✅ Customers seeded');
  }

  async seedPushSettings() {
    console.log('⚙️  Seeding push settings...');

    const settings = [
      {
        id: uuidv4(),
        customer_id: this.adminCustomerId,
        vapid_public_key: 'BKxJQYjQsZgZwsJoP7LwFhDkpMYtJc8sRJbqYjRqcQjU5Fhf9JvBZb8RZfGhOhUmJ5Gg8ZdP9HfIy6Z2FbGgBhM',
        vapid_private_key: 'Av7rZjzXvJ8QHPfDQP-zO2yU5fRzY3Z8wJKqHJK2M7Q',
        vapid_subject: 'mailto:admin@notifypro.com',
        default_title: 'NotifyPro',
        default_icon_url: '/icons/notification-icon.png',
        default_badge_url: '/icons/notification-badge.png',
        default_url: 'https://notifypro.com',
        click_action: 'https://notifypro.com',
        require_interaction: false,
        silent: false,
        ttl: 86400,
        urgency: 'normal',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        customer_id: this.demoCustomerId,
        vapid_public_key: 'BMxJQYjQsZgZwsJoP7LwFhDkpMYtJc8sRJbqYjRqcQjU5Fhf9JvBZb8RZfGhOhUmJ5Gg8ZdP9HfIy6Z2FbGgBhN',
        vapid_private_key: 'Bv7rZjzXvJ8QHPfDQP-zO2yU5fRzY3Z8wJKqHJK2M7R',
        vapid_subject: 'mailto:demo@example.com',
        default_title: 'Demo Corp',
        default_icon_url: '/icons/demo-icon.png',
        default_badge_url: '/icons/demo-badge.png',
        default_url: 'https://demo.example.com',
        click_action: 'https://demo.example.com',
        require_interaction: false,
        silent: false,
        ttl: 86400,
        urgency: 'normal',
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    for (const setting of settings) {
      const columns = Object.keys(setting).join(', ');
      const placeholders = Object.keys(setting).map(() => '?').join(', ');
      const values = Object.values(setting);

      await query(
        `INSERT INTO push_settings (${columns}) VALUES (${placeholders})`,
        values
      );
    }

    console.log('✅ Push settings seeded');
  }

  async seedNotificationTemplates() {
    console.log('📝 Seeding notification templates...');

    const templates = [
      {
        id: uuidv4(),
        customer_id: this.demoCustomerId,
        name: 'Welcome Message',
        description: 'Welcome new subscribers',
        category: 'onboarding',
        title: 'Welcome to {{company}}!',
        body: 'Thanks for subscribing! Get ready for amazing updates.',
        url: 'https://demo.example.com/welcome',
        icon_url: '/icons/welcome.png',
        tag: 'welcome',
        usage_count: 15,
        status: 'active',
        created_by: this.demoUserId,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        customer_id: this.demoCustomerId,
        name: 'Flash Sale Alert',
        description: 'Promotional flash sale notification',
        category: 'promotion',
        title: '🔥 Flash Sale: {{discount}}% OFF',
        body: 'Limited time offer! Save big on your favorite items.',
        url: 'https://demo.example.com/sale',
        icon_url: '/icons/sale.png',
        tag: 'flash-sale',
        urgency: 'high',
        usage_count: 32,
        status: 'active',
        created_by: this.demoUserId,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        customer_id: this.demoCustomerId,
        name: 'Order Update',
        description: 'Order status update notification',
        category: 'transactional',
        title: 'Order #{{orderNumber}} Update',
        body: 'Your order has been {{status}}. Track your package here.',
        url: 'https://demo.example.com/orders/{{orderNumber}}',
        icon_url: '/icons/package.png',
        tag: 'order-update',
        usage_count: 89,
        status: 'active',
        created_by: this.demoUserId,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        customer_id: this.demoCustomerId,
        name: 'Abandoned Cart',
        description: 'Cart abandonment recovery notification',
        category: 'retention',
        title: 'You left something behind!',
        body: 'Complete your purchase and save {{discount}}% with code SAVE{{discount}}',
        url: 'https://demo.example.com/cart',
        icon_url: '/icons/cart.png',
        tag: 'cart-recovery',
        usage_count: 67,
        status: 'active',
        created_by: this.demoUserId,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    for (const template of templates) {
      const columns = Object.keys(template).join(', ');
      const placeholders = Object.keys(template).map(() => '?').join(', ');
      const values = Object.values(template);

      await query(
        `INSERT INTO notification_templates (${columns}) VALUES (${placeholders})`,
        values
      );
    }

    console.log('✅ Notification templates seeded');
  }

  async seedUserSegments() {
    console.log('👥 Seeding user segments...');

    const segments = [
      {
        id: uuidv4(),
        customer_id: this.demoCustomerId,
        name: 'Active Users',
        description: 'Users who visited in the last 7 days',
        type: 'behavioral',
        conditions: JSON.stringify({
          rules: [
            {
              field: 'last_seen',
              operator: 'within_days',
              value: 7
            },
            {
              field: 'page_views',
              operator: 'greater_than',
              value: 5
            }
          ],
          logic: 'AND'
        }),
        color: '#22C55E',
        user_count: 1250,
        engagement_rate: 78.50,
        growth_rate: 12.30,
        last_calculated: new Date(),
        auto_update: true,
        status: 'active',
        created_by: this.demoUserId,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        customer_id: this.demoCustomerId,
        name: 'High Value Customers',
        description: 'Customers with orders over $500',
        type: 'behavioral',
        conditions: JSON.stringify({
          rules: [
            {
              field: 'total_spent',
              operator: 'greater_than',
              value: 500
            },
            {
              field: 'orders_count',
              operator: 'greater_than',
              value: 2
            }
          ],
          logic: 'AND'
        }),
        color: '#F59E0B',
        user_count: 320,
        engagement_rate: 92.10,
        growth_rate: 8.70,
        last_calculated: new Date(),
        auto_update: true,
        status: 'active',
        created_by: this.demoUserId,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        customer_id: this.demoCustomerId,
        name: 'Mobile Users',
        description: 'Users primarily on mobile devices',
        type: 'device',
        conditions: JSON.stringify({
          rules: [
            {
              field: 'device_type',
              operator: 'equals',
              value: 'mobile'
            }
          ],
          logic: 'AND'
        }),
        color: '#8B5CF6',
        user_count: 2840,
        engagement_rate: 65.80,
        growth_rate: 18.40,
        last_calculated: new Date(),
        auto_update: true,
        status: 'active',
        created_by: this.demoUserId,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    for (const segment of segments) {
      const columns = Object.keys(segment).join(', ');
      const placeholders = Object.keys(segment).map(() => '?').join(', ');
      const values = Object.values(segment);

      await query(
        `INSERT INTO user_segments (${columns}) VALUES (${placeholders})`,
        values
      );
    }

    console.log('✅ User segments seeded');
  }

  async seedSampleNotifications() {
    console.log('🔔 Seeding sample notifications...');

    const notifications = [
      {
        id: uuidv4(),
        customer_id: this.demoCustomerId,
        title: 'Welcome to Demo Corp!',
        body: 'Thanks for joining us. Explore our latest features!',
        url: 'https://demo.example.com/welcome',
        target_type: 'all',
        target_count: 1500,
        sent_count: 1500,
        delivered_count: 1485,
        failed_count: 15,
        opened_count: 892,
        clicked_count: 234,
        delivery_rate: 99.00,
        open_rate: 60.13,
        click_rate: 26.23,
        status: 'sent',
        sent_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        created_by: this.demoUserId,
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        customer_id: this.demoCustomerId,
        title: 'Flash Sale: 50% OFF Everything!',
        body: 'Limited time offer - Save big on all items. Shop now!',
        url: 'https://demo.example.com/sale',
        target_type: 'segment',
        target_count: 320,
        sent_count: 320,
        delivered_count: 318,
        failed_count: 2,
        opened_count: 287,
        clicked_count: 156,
        delivery_rate: 99.38,
        open_rate: 90.25,
        click_rate: 54.36,
        status: 'sent',
        sent_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        created_by: this.demoUserId,
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        updated_at: new Date()
      }
    ];

    for (const notification of notifications) {
      const columns = Object.keys(notification).join(', ');
      const placeholders = Object.keys(notification).map(() => '?').join(', ');
      const values = Object.values(notification);

      await query(
        `INSERT INTO notifications (${columns}) VALUES (${placeholders})`,
        values
      );
    }

    console.log('✅ Sample notifications seeded');
  }

  async seedWebhooks() {
    console.log('🔗 Seeding webhooks...');

    const webhooks = [
      {
        id: uuidv4(),
        customer_id: this.demoCustomerId,
        name: 'Analytics Webhook',
        url: 'https://demo.example.com/webhooks/analytics',
        secret: 'webhook_secret_analytics_123',
        events: JSON.stringify(['notification.sent', 'notification.delivered', 'notification.opened', 'notification.clicked']),
        headers: JSON.stringify({
          'X-Custom-Header': 'DemoValue',
          'Authorization': 'Bearer demo-token'
        }),
        timeout: 30,
        max_retries: 3,
        retry_delay: 60,
        last_success: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        success_count: 145,
        failure_count: 3,
        success_rate: 97.97,
        status: 'active',
        created_by: this.demoUserId,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    for (const webhook of webhooks) {
      const columns = Object.keys(webhook).join(', ');
      const placeholders = Object.keys(webhook).map(() => '?').join(', ');
      const values = Object.values(webhook);

      await query(
        `INSERT INTO webhooks (${columns}) VALUES (${placeholders})`,
        values
      );
    }

    console.log('✅ Webhooks seeded');
  }

  async seedCampaigns() {
    console.log('🎯 Seeding campaigns...');

    const campaigns = [
      {
        id: uuidv4(),
        customer_id: this.demoCustomerId,
        name: 'Welcome Series',
        description: 'Onboarding campaign for new subscribers',
        type: 'drip',
        trigger_event: 'user_subscribed',
        trigger_conditions: JSON.stringify({
          rules: [
            {
              field: 'subscription_date',
              operator: 'within_hours',
              value: 1
            }
          ]
        }),
        steps: JSON.stringify([
          {
            id: uuidv4(),
            type: 'notification',
            name: 'Welcome Message',
            title: 'Welcome to {{company}}!',
            body: 'Thanks for subscribing! Get ready for amazing updates.',
            url: 'https://demo.example.com/welcome',
            delay: 0
          },
          {
            id: uuidv4(),
            type: 'wait',
            name: 'Wait 2 days',
            duration: 2,
            unit: 'days'
          },
          {
            id: uuidv4(),
            type: 'notification',
            name: 'Feature Introduction',
            title: 'Discover our key features',
            body: 'Learn how to make the most of your subscription.',
            url: 'https://demo.example.com/features'
          }
        ]),
        total_steps: 3,
        entry_count: 245,
        active_count: 45,
        completed_count: 200,
        conversion_count: 67,
        conversion_rate: 33.50,
        status: 'active',
        started_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        created_by: this.demoUserId,
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        updated_at: new Date()
      }
    ];

    for (const campaign of campaigns) {
      const columns = Object.keys(campaign).join(', ');
      const placeholders = Object.keys(campaign).map(() => '?').join(', ');
      const values = Object.values(campaign);

      await query(
        `INSERT INTO campaigns (${columns}) VALUES (${placeholders})`,
        values
      );
    }

    console.log('✅ Campaigns seeded');
  }

  generateApiKey() {
    return 'np_' + Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
  }

  async reset() {
    console.log('🗑️  Resetting database...');

    const tables = [
      'analytics_summaries',
      'metrics', 
      'campaign_executions',
      'campaigns',
      'ab_test_participants',
      'ab_test_variants', 
      'ab_tests',
      'webhook_deliveries',
      'webhooks',
      'notification_deliveries',
      'scheduled_notifications',
      'notifications',
      'segment_memberships',
      'user_segments',
      'notification_templates',
      'push_subscriptions',
      'push_settings',
      'customers',
      'users'
    ];

    for (const table of tables) {
      await query(`DELETE FROM ${table}`);
    }

    // Only clear migration history if it exists
    try {
      await query('DELETE FROM migration_history');
    } catch (error) {
      // Ignore if table doesn't exist
      if (!error.message.includes("doesn't exist")) {
        throw error;
      }
    }

    console.log('✅ Database reset completed');
  }
}

module.exports = DataSeeder;