const { query } = require('../config/database');

const up = async () => {
  // Notifications table - for sent notifications
  await query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
      customer_id CHAR(36) NOT NULL,
      template_id CHAR(36) NULL,
      segment_id CHAR(36) NULL,
      campaign_id CHAR(36) NULL,
      title VARCHAR(255) NOT NULL,
      body TEXT NOT NULL,
      url TEXT NULL,
      icon_url TEXT NULL,
      badge_url TEXT NULL,
      image_url TEXT NULL,
      tag VARCHAR(100) NULL,
      ttl INT NULL,
      urgency ENUM('very-low', 'low', 'normal', 'high') DEFAULT 'normal',
      require_interaction BOOLEAN DEFAULT FALSE,
      silent BOOLEAN DEFAULT FALSE,
      actions JSON NULL,
      custom_data JSON NULL,
      target_type ENUM('all', 'segment', 'individual') DEFAULT 'all',
      target_count INT DEFAULT 0,
      sent_count INT DEFAULT 0,
      delivered_count INT DEFAULT 0,
      failed_count INT DEFAULT 0,
      opened_count INT DEFAULT 0,
      clicked_count INT DEFAULT 0,
      delivery_rate DECIMAL(5,2) DEFAULT 0.00,
      open_rate DECIMAL(5,2) DEFAULT 0.00,
      click_rate DECIMAL(5,2) DEFAULT 0.00,
      cost DECIMAL(10,4) DEFAULT 0.0000,
      status ENUM('draft', 'sending', 'sent', 'failed', 'cancelled') DEFAULT 'draft',
      sent_at TIMESTAMP NULL,
      created_by CHAR(36) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
      FOREIGN KEY (template_id) REFERENCES notification_templates(id) ON DELETE SET NULL,
      FOREIGN KEY (segment_id) REFERENCES user_segments(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_customer_id (customer_id),
      INDEX idx_template_id (template_id),
      INDEX idx_segment_id (segment_id),
      INDEX idx_status (status),
      INDEX idx_sent_at (sent_at),
      INDEX idx_created_at (created_at)
    )
  `);

  // Scheduled notifications table
  await query(`
    CREATE TABLE IF NOT EXISTS scheduled_notifications (
      id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
      customer_id CHAR(36) NOT NULL,
      template_id CHAR(36) NULL,
      segment_id CHAR(36) NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT NULL,
      notification_data JSON NOT NULL,
      scheduled_for TIMESTAMP NOT NULL,
      timezone VARCHAR(50) DEFAULT 'UTC',
      recurring BOOLEAN DEFAULT FALSE,
      recurrence_rule JSON NULL,
      next_run_at TIMESTAMP NULL,
      end_date TIMESTAMP NULL,
      max_occurrences INT NULL,
      occurrence_count INT DEFAULT 0,
      last_run_at TIMESTAMP NULL,
      last_notification_id CHAR(36) NULL,
      retry_count INT DEFAULT 0,
      max_retries INT DEFAULT 3,
      retry_delay INT DEFAULT 300,
      status ENUM('active', 'paused', 'completed', 'cancelled', 'failed') DEFAULT 'active',
      created_by CHAR(36) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
      FOREIGN KEY (template_id) REFERENCES notification_templates(id) ON DELETE SET NULL,
      FOREIGN KEY (segment_id) REFERENCES user_segments(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_customer_id (customer_id),
      INDEX idx_scheduled_for (scheduled_for),
      INDEX idx_next_run_at (next_run_at),
      INDEX idx_status (status),
      INDEX idx_recurring (recurring)
    )
  `);

  // Notification deliveries table - individual delivery tracking
  await query(`
    CREATE TABLE IF NOT EXISTS notification_deliveries (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      notification_id CHAR(36) NOT NULL,
      subscription_id CHAR(36) NOT NULL,
      status ENUM('pending', 'sent', 'delivered', 'failed', 'expired') DEFAULT 'pending',
      error_code VARCHAR(50) NULL,
      error_message TEXT NULL,
      response_data JSON NULL,
      sent_at TIMESTAMP NULL,
      delivered_at TIMESTAMP NULL,
      opened_at TIMESTAMP NULL,
      clicked_at TIMESTAMP NULL,
      retry_count INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE,
      FOREIGN KEY (subscription_id) REFERENCES push_subscriptions(id) ON DELETE CASCADE,
      INDEX idx_notification_id (notification_id),
      INDEX idx_subscription_id (subscription_id),
      INDEX idx_status (status),
      INDEX idx_sent_at (sent_at),
      INDEX idx_delivered_at (delivered_at)
    )
  `);

  console.log('✅ Notifications and scheduling tables created');
};

const down = async () => {
  await query('DROP TABLE IF EXISTS notification_deliveries');
  await query('DROP TABLE IF EXISTS scheduled_notifications');
  await query('DROP TABLE IF EXISTS notifications');
  console.log('✅ Notifications and scheduling tables dropped');
};

module.exports = { up, down };