const { query } = require('../config/database');

const up = async () => {
  // Push subscriptions table
  await query(`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
      customer_id CHAR(36) NOT NULL,
      endpoint TEXT NOT NULL,
      p256dh_key VARCHAR(255) NOT NULL,
      auth_key VARCHAR(255) NOT NULL,
      user_agent TEXT NULL,
      ip_address VARCHAR(45) NULL,
      country VARCHAR(2) NULL,
      city VARCHAR(100) NULL,
      region VARCHAR(100) NULL,
      browser VARCHAR(50) NULL,
      browser_version VARCHAR(20) NULL,
      os VARCHAR(50) NULL,
      device VARCHAR(20) NULL,
      tags JSON NULL,
      custom_data JSON NULL,
      engagement_score INT DEFAULT 0,
      click_count INT DEFAULT 0,
      open_count INT DEFAULT 0,
      last_active TIMESTAMP NULL,
      last_click TIMESTAMP NULL,
      timezone VARCHAR(50) NULL,
      preferred_time VARCHAR(5) NULL,
      subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      unsubscribed_at TIMESTAMP NULL,
      status ENUM('active', 'inactive', 'unsubscribed') DEFAULT 'active',
      
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
      INDEX idx_customer_id (customer_id),
      INDEX idx_status (status),
      INDEX idx_country (country),
      INDEX idx_device (device),
      INDEX idx_engagement_score (engagement_score),
      INDEX idx_subscribed_at (subscribed_at),
      INDEX idx_last_active (last_active)
    )
  `);

  // Push settings table
  await query(`
    CREATE TABLE IF NOT EXISTS push_settings (
      id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
      customer_id CHAR(36) NOT NULL UNIQUE,
      vapid_public_key TEXT NOT NULL,
      vapid_private_key TEXT NOT NULL,
      vapid_subject VARCHAR(255) NOT NULL,
      default_title VARCHAR(255) NULL,
      default_icon_url TEXT NULL,
      default_badge_url TEXT NULL,
      default_image_url TEXT NULL,
      default_url TEXT NULL,
      click_action VARCHAR(255) NULL,
      require_interaction BOOLEAN DEFAULT FALSE,
      silent BOOLEAN DEFAULT FALSE,
      ttl INT DEFAULT 86400,
      urgency ENUM('very-low', 'low', 'normal', 'high') DEFAULT 'normal',
      topic VARCHAR(255) NULL,
      custom_headers JSON NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
      INDEX idx_customer_id (customer_id)
    )
  `);

  console.log('✅ Push subscriptions and settings tables created');
};

const down = async () => {
  await query('DROP TABLE IF EXISTS push_settings');
  await query('DROP TABLE IF EXISTS push_subscriptions');
  console.log('✅ Push subscriptions and settings tables dropped');
};

module.exports = { up, down };