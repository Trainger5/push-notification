const { query } = require('../config/database');

const up = async () => {
  // Add missing columns to notifications table
  const missingColumns = [
    { name: 'payload', type: 'JSON NULL', after: 'custom_data' },
    { name: 'sentAt', type: 'TIMESTAMP NULL', after: 'payload' },
    { name: 'success', type: 'INT DEFAULT 0', after: 'sentAt' },
    { name: 'failed', type: 'INT DEFAULT 0', after: 'success' }
  ];

  for (const column of missingColumns) {
    try {
      await query(`
        ALTER TABLE notifications 
        ADD COLUMN ${column.name} ${column.type} AFTER ${column.after}
      `);
      console.log(`✅ Added ${column.name} column to notifications table`);
    } catch (error) {
      if (error.message.includes('Duplicate column name')) {
        console.log(`ℹ️  ${column.name} column already exists in notifications table`);
      } else {
        console.error(`❌ Error adding ${column.name} column:`, error.message);
      }
    }
  }

  console.log('✅ Database schema updated');
};

const down = async () => {
  const columnsToRemove = ['failed', 'success', 'sentAt', 'payload'];
  
  for (const column of columnsToRemove) {
    try {
      await query(`
        ALTER TABLE notifications 
        DROP COLUMN ${column}
      `);
      console.log(`✅ Removed ${column} column from notifications table`);
    } catch (error) {
      console.error(`❌ Error removing ${column} column:`, error.message);
    }
  }
};

module.exports = { up, down };