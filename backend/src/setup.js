const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { createDatabase, query, testConnection, closePool } = require('./config/database');
const MigrationRunner = require('./migrations/run-migrations');

class SetupManager {
  constructor() {
    this.migrationRunner = new MigrationRunner();
  }

  async setupDatabase() {
    try {
      console.log('🚀 Starting Push Notification System setup...\n');

      // Step 1: Create database
      console.log('📁 Creating database...');
      await createDatabase();

      // Step 2: Test connection
      console.log('🔗 Testing database connection...');
      const connected = await testConnection();
      if (!connected) {
        throw new Error('Failed to connect to database');
      }

      // Step 3: Run migrations
      console.log('📝 Running database migrations...');
      await this.migrationRunner.run();

      // Step 4: Seed initial data
      console.log('🌱 Seeding initial data...');
      await this.seedInitialData();

      // Step 5: Generate VAPID keys for demo customer
      console.log('🔐 Generating VAPID keys...');
      await this.generateVapidKeys();

      console.log('\n✅ Setup completed successfully!');
      console.log('\n📋 Setup Summary:');
      console.log('   • Database created and migrated');
      console.log('   • Admin user: admin@example.com (password: admin123)');
      console.log('   • Demo customer: demo@customer.com (password: password123)');
      console.log('   • VAPID keys generated');
      console.log('\n🚀 You can now start the server with: npm start');

    } catch (error) {
      console.error('\n❌ Setup failed:', error.message);
      console.error(error.stack);
      throw error;
    }
  }

  async seedInitialData() {
    // Create admin user
    const adminId = uuidv4();
    const adminPassword = await bcrypt.hash('admin123', 12);
    
    await query(`
      INSERT IGNORE INTO users (id, email, password_hash, role, email_verified, created_at) 
      VALUES (?, ?, ?, 'admin', TRUE, NOW())
    `, [adminId, 'admin@example.com', adminPassword]);

    // Create demo customer user
    const demoUserId = uuidv4();
    const demoPassword = await bcrypt.hash('password123', 12);
    
    await query(`
      INSERT IGNORE INTO users (id, email, password_hash, role, email_verified, created_at) 
      VALUES (?, ?, ?, 'customer', TRUE, NOW())
    `, [demoUserId, 'demo@customer.com', demoPassword]);

    // Create demo customer record
    const customerId = uuidv4();
    const apiKey = 'demo_' + Math.random().toString(36).substr(2, 15);
    
    await query(`
      INSERT IGNORE INTO customers (id, user_id, name, email, company_name, country, plan, api_key, status, subscriber_limit, monthly_quota, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', 10000, 100000, NOW())
    `, [customerId, demoUserId, 'Demo Company', 'demo@customer.com', 'Demo Company Inc.', 'US', 'pro', apiKey]);

    // Create sample notification templates
    await this.createSampleTemplates(customerId, demoUserId);

    // Create sample segments
    await this.createSampleSegments(customerId, demoUserId);

    console.log('   • Admin and demo users created');
    console.log('   • Sample templates and segments created');
  }

  async createSampleTemplates(customerId, userId) {
    const templates = [
      {
        id: uuidv4(),
        name: 'Welcome Message',
        category: 'welcome',
        title: 'Welcome to {{company_name}}!',
        body: 'Thanks for subscribing to our notifications. Stay tuned for updates!',
        description: 'Welcome new subscribers'
      },
      {
        id: uuidv4(),
        name: 'Flash Sale Alert',
        category: 'promotional',
        title: '⚡ Flash Sale - 50% Off!',
        body: 'Limited time offer! Get 50% off all products. Sale ends in 24 hours!',
        description: 'Promotional flash sale notification'
      },
      {
        id: uuidv4(),
        name: 'Order Confirmation',
        category: 'transactional',
        title: 'Order Confirmed #{{order_id}}',
        body: 'Your order has been confirmed and will be shipped within 2-3 business days.',
        description: 'Order confirmation notification'
      },
      {
        id: uuidv4(),
        name: 'Weekly Newsletter',
        category: 'marketing',
        title: 'This Week in {{company_name}}',
        body: 'Check out our latest updates, new features, and upcoming events.',
        description: 'Weekly newsletter notification'
      }
    ];

    for (const template of templates) {
      await query(`
        INSERT IGNORE INTO notification_templates (id, customer_id, name, description, category, title, body, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [template.id, customerId, template.name, template.description, template.category, template.title, template.body, userId]);
    }
  }

  async createSampleSegments(customerId, userId) {
    const segments = [
      {
        id: uuidv4(),
        name: 'New Subscribers',
        type: 'behavioral',
        description: 'Users who subscribed in the last 7 days',
        conditions: {
          subscriptionDate: {
            start: null,
            end: null,
            last_days: 7
          }
        }
      },
      {
        id: uuidv4(),
        name: 'High Engagement',
        type: 'engagement',
        description: 'Users with high click and open rates',
        conditions: {
          engagementScore: {
            min: 75,
            max: 100
          },
          recentlyActive: true
        }
      },
      {
        id: uuidv4(),
        name: 'Mobile Users',
        type: 'device',
        description: 'Users on mobile devices',
        conditions: {
          devices: ['mobile', 'tablet']
        }
      },
      {
        id: uuidv4(),
        name: 'US Subscribers',
        type: 'geographic',
        description: 'Subscribers from the United States',
        conditions: {
          countries: ['US']
        }
      }
    ];

    for (const segment of segments) {
      await query(`
        INSERT IGNORE INTO user_segments (id, customer_id, name, description, type, conditions, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [segment.id, customerId, segment.name, segment.description, segment.type, JSON.stringify(segment.conditions), userId]);
    }
  }

  async generateVapidKeys() {
    const webpush = require('web-push');
    
    try {
      // Generate VAPID keys
      const vapidKeys = webpush.generateVAPIDKeys();
      
      // Get demo customer
      const customers = await query('SELECT id FROM customers WHERE email = ?', ['demo@customer.com']);
      
      if (customers.length > 0) {
        const customerId = customers[0].id;
        
        // Insert VAPID settings
        await query(`
          INSERT INTO push_settings (id, customer_id, vapid_public_key, vapid_private_key, vapid_subject, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, NOW(), NOW())
          ON DUPLICATE KEY UPDATE 
            vapid_public_key = VALUES(vapid_public_key),
            vapid_private_key = VALUES(vapid_private_key),
            vapid_subject = VALUES(vapid_subject),
            updated_at = NOW()
        `, [uuidv4(), customerId, vapidKeys.publicKey, vapidKeys.privateKey, 'mailto:demo@customer.com']);
        
        console.log('   • VAPID keys generated for demo customer');
      }
    } catch (error) {
      console.error('   ⚠️  Failed to generate VAPID keys:', error.message);
    }
  }

  async checkSetupStatus() {
    try {
      const connected = await testConnection();
      if (!connected) {
        return { setup: false, reason: 'Database connection failed' };
      }

      // Check if migrations table exists
      const tables = await query("SHOW TABLES LIKE 'migrations'");
      if (tables.length === 0) {
        return { setup: false, reason: 'Migrations table not found' };
      }

      // Check if users exist
      const users = await query('SELECT COUNT(*) as count FROM users');
      if (users[0].count === 0) {
        return { setup: false, reason: 'No users found' };
      }

      return { setup: true };
    } catch (error) {
      return { setup: false, reason: error.message };
    }
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  const setup = new SetupManager();
  setup.setupDatabase()
    .then(() => {
      console.log('\n🎉 Setup process completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Setup process failed:', error.message);
      process.exit(1);
    })
    .finally(async () => {
      await closePool();
    });
}

module.exports = SetupManager;