#!/usr/bin/env node

const { createDatabase, testConnection } = require('../config/database');
const MigrationRunner = require('../migrations/run-migrations');
const DataSeeder = require('../seeders/seed-data');

async function runSeeder() {
  console.log('🌱 Push Notification System - Database Seeder');
  console.log('='.repeat(50));

  try {
    // Check if --reset flag is provided
    const shouldReset = process.argv.includes('--reset');
    
    if (shouldReset) {
      console.log('🔄 Reset mode enabled - will clear existing data');
    }

    // Create database if needed
    console.log('📁 Ensuring database exists...');
    await createDatabase();

    // Test connection
    console.log('🔗 Testing database connection...');
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }

    // Run migrations
    console.log('📝 Ensuring database schema is up to date...');
    const migrationRunner = new MigrationRunner();
    await migrationRunner.run();

    // Initialize seeder
    const seeder = new DataSeeder();

    // Reset if requested
    if (shouldReset) {
      await seeder.reset();
      console.log('✅ Database reset completed');
    }

    // Run seeding
    await seeder.seed();

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📋 Seeded data:');
    console.log('   👤 Admin User: admin@notifypro.com (password: admin123)');
    console.log('   👤 Demo User: demo@example.com (password: demo123)');
    console.log('   🏢 2 Customer accounts with settings');
    console.log('   📝 4 Notification templates');
    console.log('   👥 3 User segments');
    console.log('   🔔 2 Sample notifications');
    console.log('   🔗 1 Webhook configuration');
    console.log('   🎯 1 Campaign with drip sequence');
    
    console.log('\n🚀 You can now start using the system!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('Push Notification System - Database Seeder\n');
  console.log('Usage: npm run seed [options]\n');
  console.log('Options:');
  console.log('  --reset    Clear existing data before seeding');
  console.log('  --help     Show this help message');
  process.exit(0);
}

// Run the seeder
runSeeder();