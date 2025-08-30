const { query } = require('../config/database');

const up = async () => {
  // Notification templates table
  await query(`
    CREATE TABLE IF NOT EXISTS notification_templates (
      id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
      customer_id CHAR(36) NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT NULL,
      category VARCHAR(100) NULL,
      title VARCHAR(255) NOT NULL,
      body TEXT NOT NULL,
      url TEXT NULL,
      icon_url TEXT NULL,
      badge_url TEXT NULL,
      image_url TEXT NULL,
      tag VARCHAR(100) NULL,
      ttl INT NULL,
      urgency ENUM('very-low', 'low', 'normal', 'high') NULL,
      require_interaction BOOLEAN DEFAULT FALSE,
      silent BOOLEAN DEFAULT FALSE,
      actions JSON NULL,
      custom_data JSON NULL,
      usage_count INT DEFAULT 0,
      last_used TIMESTAMP NULL,
      status ENUM('active', 'inactive', 'archived') DEFAULT 'active',
      created_by CHAR(36) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_customer_id (customer_id),
      INDEX idx_category (category),
      INDEX idx_status (status),
      INDEX idx_usage_count (usage_count),
      INDEX idx_created_at (created_at)
    )
  `);

  // User segments table
  await query(`
    CREATE TABLE IF NOT EXISTS user_segments (
      id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
      customer_id CHAR(36) NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT NULL,
      type ENUM('behavioral', 'demographic', 'geographic', 'device', 'engagement', 'custom') DEFAULT 'custom',
      conditions JSON NOT NULL,
      color VARCHAR(7) DEFAULT '#3182CE',
      user_count INT DEFAULT 0,
      engagement_rate DECIMAL(5,2) DEFAULT 0.00,
      growth_rate DECIMAL(5,2) DEFAULT 0.00,
      last_calculated TIMESTAMP NULL,
      auto_update BOOLEAN DEFAULT TRUE,
      status ENUM('active', 'inactive', 'archived') DEFAULT 'active',
      created_by CHAR(36) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_customer_id (customer_id),
      INDEX idx_type (type),
      INDEX idx_status (status),
      INDEX idx_user_count (user_count),
      INDEX idx_engagement_rate (engagement_rate)
    )
  `);

  // Segment memberships table (for caching segment calculations)
  await query(`
    CREATE TABLE IF NOT EXISTS segment_memberships (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      segment_id CHAR(36) NOT NULL,
      subscription_id CHAR(36) NOT NULL,
      added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (segment_id) REFERENCES user_segments(id) ON DELETE CASCADE,
      FOREIGN KEY (subscription_id) REFERENCES push_subscriptions(id) ON DELETE CASCADE,
      UNIQUE KEY unique_membership (segment_id, subscription_id),
      INDEX idx_segment_id (segment_id),
      INDEX idx_subscription_id (subscription_id)
    )
  `);

  console.log('✅ Templates and segments tables created');
};

const down = async () => {
  await query('DROP TABLE IF EXISTS segment_memberships');
  await query('DROP TABLE IF EXISTS user_segments');
  await query('DROP TABLE IF EXISTS notification_templates');
  console.log('✅ Templates and segments tables dropped');
};

module.exports = { up, down };