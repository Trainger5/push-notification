const { query } = require('../config/database');

const up = async () => {
  // Campaigns table
  await query(`
    CREATE TABLE IF NOT EXISTS campaigns (
      id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
      customer_id CHAR(36) NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT NULL,
      type ENUM('drip', 'broadcast', 'triggered', 'lifecycle') DEFAULT 'drip',
      trigger_event VARCHAR(100) NULL,
      trigger_conditions JSON NULL,
      target_segment_id CHAR(36) NULL,
      steps JSON NOT NULL,
      total_steps INT DEFAULT 0,
      entry_count INT DEFAULT 0,
      active_count INT DEFAULT 0,
      completed_count INT DEFAULT 0,
      conversion_count INT DEFAULT 0,
      revenue DECIMAL(15,2) DEFAULT 0.00,
      conversion_rate DECIMAL(5,2) DEFAULT 0.00,
      avg_time_to_convert INT NULL,
      status ENUM('draft', 'active', 'paused', 'completed', 'archived') DEFAULT 'draft',
      started_at TIMESTAMP NULL,
      paused_at TIMESTAMP NULL,
      completed_at TIMESTAMP NULL,
      created_by CHAR(36) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
      FOREIGN KEY (target_segment_id) REFERENCES user_segments(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_customer_id (customer_id),
      INDEX idx_type (type),
      INDEX idx_status (status),
      INDEX idx_started_at (started_at)
    )
  `);

  // Campaign executions table
  await query(`
    CREATE TABLE IF NOT EXISTS campaign_executions (
      id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
      campaign_id CHAR(36) NOT NULL,
      subscription_id CHAR(36) NOT NULL,
      current_step_index INT DEFAULT 0,
      status ENUM('active', 'waiting', 'completed', 'failed', 'cancelled') DEFAULT 'active',
      trigger_data JSON NULL,
      step_history JSON NULL,
      next_execution_at TIMESTAMP NULL,
      started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP NULL,
      failed_at TIMESTAMP NULL,
      error_message TEXT NULL,
      conversion_value DECIMAL(10,2) DEFAULT 0.00,
      converted_at TIMESTAMP NULL,
      
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
      FOREIGN KEY (subscription_id) REFERENCES push_subscriptions(id) ON DELETE CASCADE,
      UNIQUE KEY unique_execution (campaign_id, subscription_id),
      INDEX idx_campaign_id (campaign_id),
      INDEX idx_subscription_id (subscription_id),
      INDEX idx_status (status),
      INDEX idx_next_execution_at (next_execution_at)
    )
  `);

  // Metrics table - for tracking events
  await query(`
    CREATE TABLE IF NOT EXISTS metrics (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      customer_id CHAR(36) NOT NULL,
      subscription_id CHAR(36) NULL,
      notification_id CHAR(36) NULL,
      campaign_id CHAR(36) NULL,
      ab_test_id CHAR(36) NULL,
      event_type ENUM('sent', 'delivered', 'opened', 'clicked', 'closed', 'subscribed', 'unsubscribed', 'conversion') NOT NULL,
      event_data JSON NULL,
      user_agent TEXT NULL,
      ip_address VARCHAR(45) NULL,
      country VARCHAR(2) NULL,
      city VARCHAR(100) NULL,
      browser VARCHAR(50) NULL,
      device VARCHAR(20) NULL,
      os VARCHAR(50) NULL,
      referrer TEXT NULL,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
      FOREIGN KEY (subscription_id) REFERENCES push_subscriptions(id) ON DELETE SET NULL,
      FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE SET NULL,
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL,
      INDEX idx_customer_id (customer_id),
      INDEX idx_subscription_id (subscription_id),
      INDEX idx_notification_id (notification_id),
      INDEX idx_campaign_id (campaign_id),
      INDEX idx_event_type (event_type),
      INDEX idx_timestamp (timestamp),
      INDEX idx_country (country)
    )
  `);

  // Analytics summaries table - for dashboard performance
  await query(`
    CREATE TABLE IF NOT EXISTS analytics_summaries (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      customer_id CHAR(36) NOT NULL,
      date DATE NOT NULL,
      period_type ENUM('daily', 'weekly', 'monthly') DEFAULT 'daily',
      total_sent INT DEFAULT 0,
      total_delivered INT DEFAULT 0,
      total_opened INT DEFAULT 0,
      total_clicked INT DEFAULT 0,
      total_conversions INT DEFAULT 0,
      unique_opens INT DEFAULT 0,
      unique_clicks INT DEFAULT 0,
      delivery_rate DECIMAL(5,2) DEFAULT 0.00,
      open_rate DECIMAL(5,2) DEFAULT 0.00,
      click_rate DECIMAL(5,2) DEFAULT 0.00,
      conversion_rate DECIMAL(5,2) DEFAULT 0.00,
      bounce_rate DECIMAL(5,2) DEFAULT 0.00,
      unsubscribe_rate DECIMAL(5,2) DEFAULT 0.00,
      revenue DECIMAL(15,2) DEFAULT 0.00,
      cost DECIMAL(10,4) DEFAULT 0.0000,
      roi DECIMAL(10,2) DEFAULT 0.00,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
      UNIQUE KEY unique_summary (customer_id, date, period_type),
      INDEX idx_customer_id (customer_id),
      INDEX idx_date (date),
      INDEX idx_period_type (period_type)
    )
  `);

  console.log('✅ Campaigns and metrics tables created');
};

const down = async () => {
  await query('DROP TABLE IF EXISTS analytics_summaries');
  await query('DROP TABLE IF EXISTS metrics');
  await query('DROP TABLE IF EXISTS campaign_executions');
  await query('DROP TABLE IF EXISTS campaigns');
  console.log('✅ Campaigns and metrics tables dropped');
};

module.exports = { up, down };