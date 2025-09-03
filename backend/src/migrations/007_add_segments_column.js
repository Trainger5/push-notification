const { query } = require('../config/database');

const up = async () => {
  // Add segments column to push_subscriptions table
  await query(`
    ALTER TABLE push_subscriptions 
    ADD COLUMN segments JSON NULL AFTER tags
  `);

  console.log('✅ Added segments column to push_subscriptions table');
};

const down = async () => {
  await query(`
    ALTER TABLE push_subscriptions 
    DROP COLUMN segments
  `);
  console.log('✅ Removed segments column from push_subscriptions table');
};

module.exports = { up, down };