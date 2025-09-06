const { query } = require('../config/database');

const up = async () => {
  console.log('🔧 Fixing column name mismatches...');

  // Fix scheduled_notifications table
  // Add the expected columns if they don't exist
  const scheduledNotificationsFixes = [
    // Add scheduled_at based on scheduled_for for backward compatibility
    { 
      name: 'scheduled_at', 
      type: 'TIMESTAMP NULL', 
      description: 'Add scheduled_at column for compatibility'
    },
    // Add other missing columns that code expects
    { 
      name: 'title', 
      type: 'VARCHAR(255) NULL', 
      description: 'Add title column'
    },
    { 
      name: 'body', 
      type: 'TEXT NULL', 
      description: 'Add body column'
    },
    { 
      name: 'url', 
      type: 'TEXT NULL', 
      description: 'Add url column'
    },
    { 
      name: 'icon', 
      type: 'TEXT NULL', 
      description: 'Add icon column'
    },
    { 
      name: 'sent_count', 
      type: 'INT DEFAULT 0', 
      description: 'Add sent_count column'
    },
    { 
      name: 'failed_count', 
      type: 'INT DEFAULT 0', 
      description: 'Add failed_count column'
    },
    { 
      name: 'completed_at', 
      type: 'TIMESTAMP NULL', 
      description: 'Add completed_at column'
    },
    { 
      name: 'error_message', 
      type: 'TEXT NULL', 
      description: 'Add error_message column'
    }
  ];

  for (const fix of scheduledNotificationsFixes) {
    try {
      await query(`
        ALTER TABLE scheduled_notifications 
        ADD COLUMN ${fix.name} ${fix.type}
      `);
      console.log(`✅ ${fix.description}`);
    } catch (error) {
      if (error.message.includes('Duplicate column name')) {
        console.log(`ℹ️  ${fix.name} column already exists in scheduled_notifications table`);
      } else {
        console.error(`❌ Error adding ${fix.name} column:`, error.message);
      }
    }
  }

  // Update scheduled_at to match scheduled_for where it's null
  try {
    await query(`
      UPDATE scheduled_notifications 
      SET scheduled_at = scheduled_for 
      WHERE scheduled_at IS NULL AND scheduled_for IS NOT NULL
    `);
    console.log('✅ Updated scheduled_at column with scheduled_for values');
  } catch (error) {
    console.error('❌ Error updating scheduled_at:', error.message);
  }

  // Fix notifications table - add icon column if it doesn't exist (code expects 'icon', schema has 'icon_url')
  try {
    await query(`
      ALTER TABLE notifications 
      ADD COLUMN icon TEXT NULL AFTER url
    `);
    console.log('✅ Added icon column to notifications table');
  } catch (error) {
    if (error.message.includes('Duplicate column name')) {
      console.log('ℹ️  icon column already exists in notifications table');
    } else {
      console.error('❌ Error adding icon column:', error.message);
    }
  }

  // Update icon column with icon_url values where icon is null
  try {
    await query(`
      UPDATE notifications 
      SET icon = icon_url 
      WHERE icon IS NULL AND icon_url IS NOT NULL
    `);
    console.log('✅ Updated icon column with icon_url values');
  } catch (error) {
    console.error('❌ Error updating icon column:', error.message);
  }

  // Update scheduled_notifications status values to match what code expects
  try {
    await query(`
      UPDATE scheduled_notifications 
      SET status = 'pending' 
      WHERE status = 'active'
    `);
    console.log('✅ Updated scheduled_notifications status from active to pending');
  } catch (error) {
    console.error('❌ Error updating status:', error.message);
  }

  // Add missing status values to enum if needed
  try {
    await query(`
      ALTER TABLE scheduled_notifications 
      MODIFY COLUMN status ENUM('pending', 'processing', 'sent', 'failed', 'cancelled', 'active', 'paused', 'completed') DEFAULT 'pending'
    `);
    console.log('✅ Updated scheduled_notifications status enum');
  } catch (error) {
    console.error('❌ Error updating status enum:', error.message);
  }

  console.log('✅ Column mismatch fixes completed');
};

const down = async () => {
  console.log('🔄 Reversing column mismatch fixes...');

  const columnsToRemove = [
    'scheduled_at', 'title', 'body', 'url', 'icon', 
    'sent_count', 'failed_count', 'completed_at', 'error_message'
  ];

  for (const column of columnsToRemove) {
    try {
      await query(`
        ALTER TABLE scheduled_notifications 
        DROP COLUMN ${column}
      `);
      console.log(`✅ Removed ${column} column from scheduled_notifications`);
    } catch (error) {
      if (!error.message.includes("check that column/key exists")) {
        console.error(`❌ Error removing ${column} column:`, error.message);
      }
    }
  }

  try {
    await query(`
      ALTER TABLE notifications 
      DROP COLUMN icon
    `);
    console.log('✅ Removed icon column from notifications');
  } catch (error) {
    if (!error.message.includes("check that column/key exists")) {
      console.error('❌ Error removing icon column:', error.message);
    }
  }

  console.log('✅ Column mismatch fixes reversed');
};

module.exports = { up, down };