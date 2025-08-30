const { createDatabase, query, testConnection, closePool } = require('../config/database');

async function resetDatabase() {
  try {
    console.log('🔄 Resetting database...');
    
    // Create database first
    await createDatabase();
    
    // Test connection
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Failed to connect to database');
    }

    // Drop all tables in the correct order (reverse of creation)
    const tables = [
      'migrations',
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
      'push_settings',
      'push_subscriptions',
      'api_keys',
      'customers',
      'users'
    ];

    // Disable foreign key checks temporarily
    await query('SET foreign_key_checks = 0');

    for (const table of tables) {
      try {
        await query(`DROP TABLE IF EXISTS ${table}`);
        console.log(`✅ Dropped table: ${table}`);
      } catch (error) {
        console.log(`⚠️  Table ${table} didn't exist or couldn't be dropped`);
      }
    }

    // Re-enable foreign key checks
    await query('SET foreign_key_checks = 1');

    console.log('✅ Database reset completed successfully');
  } catch (error) {
    console.error('❌ Database reset failed:', error.message);
    throw error;
  } finally {
    await closePool();
  }
}

// Run reset if this file is executed directly
if (require.main === module) {
  resetDatabase()
    .then(() => {
      console.log('✅ Reset process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Reset process failed:', error.message);
      process.exit(1);
    });
}

module.exports = resetDatabase;