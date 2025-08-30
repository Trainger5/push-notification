const { query } = require('../config/database');

const up = async () => {
  // Webhooks table
  await query(`
    CREATE TABLE IF NOT EXISTS webhooks (
      id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
      customer_id CHAR(36) NOT NULL,
      name VARCHAR(255) NOT NULL,
      url TEXT NOT NULL,
      secret VARCHAR(255) NULL,
      events JSON NOT NULL,
      headers JSON NULL,
      timeout INT DEFAULT 30,
      max_retries INT DEFAULT 3,
      retry_delay INT DEFAULT 60,
      last_success TIMESTAMP NULL,
      last_failure TIMESTAMP NULL,
      success_count INT DEFAULT 0,
      failure_count INT DEFAULT 0,
      success_rate DECIMAL(5,2) DEFAULT 100.00,
      status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
      created_by CHAR(36) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_customer_id (customer_id),
      INDEX idx_status (status),
      INDEX idx_success_rate (success_rate)
    )
  `);

  // Webhook deliveries table
  await query(`
    CREATE TABLE IF NOT EXISTS webhook_deliveries (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      webhook_id CHAR(36) NOT NULL,
      event_type VARCHAR(100) NOT NULL,
      payload JSON NOT NULL,
      headers JSON NULL,
      status ENUM('pending', 'success', 'failed', 'retrying') DEFAULT 'pending',
      http_status INT NULL,
      response_body TEXT NULL,
      response_time_ms INT NULL,
      error_message TEXT NULL,
      retry_count INT DEFAULT 0,
      next_retry_at TIMESTAMP NULL,
      sent_at TIMESTAMP NULL,
      completed_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (webhook_id) REFERENCES webhooks(id) ON DELETE CASCADE,
      INDEX idx_webhook_id (webhook_id),
      INDEX idx_event_type (event_type),
      INDEX idx_status (status),
      INDEX idx_next_retry_at (next_retry_at),
      INDEX idx_created_at (created_at)
    )
  `);

  // A/B tests table
  await query(`
    CREATE TABLE IF NOT EXISTS ab_tests (
      id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
      customer_id CHAR(36) NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT NULL,
      hypothesis TEXT NULL,
      metric ENUM('open_rate', 'click_rate', 'conversion_rate', 'engagement_score') DEFAULT 'click_rate',
      traffic_split INT DEFAULT 50,
      target_segment_id CHAR(36) NULL,
      min_sample_size INT DEFAULT 100,
      confidence_level DECIMAL(4,2) DEFAULT 95.00,
      expected_lift DECIMAL(5,2) DEFAULT 10.00,
      duration_days INT DEFAULT 7,
      start_date TIMESTAMP NULL,
      end_date TIMESTAMP NULL,
      winner_variant_id CHAR(36) NULL,
      statistical_significance BOOLEAN DEFAULT FALSE,
      confidence_interval JSON NULL,
      status ENUM('draft', 'running', 'paused', 'completed', 'cancelled') DEFAULT 'draft',
      created_by CHAR(36) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
      FOREIGN KEY (target_segment_id) REFERENCES user_segments(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_customer_id (customer_id),
      INDEX idx_status (status),
      INDEX idx_start_date (start_date),
      INDEX idx_end_date (end_date)
    )
  `);

  // A/B test variants table
  await query(`
    CREATE TABLE IF NOT EXISTS ab_test_variants (
      id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
      test_id CHAR(36) NOT NULL,
      name VARCHAR(255) NOT NULL,
      is_control BOOLEAN DEFAULT FALSE,
      traffic_percentage DECIMAL(5,2) NOT NULL,
      template_id CHAR(36) NULL,
      notification_data JSON NOT NULL,
      participant_count INT DEFAULT 0,
      sent_count INT DEFAULT 0,
      delivered_count INT DEFAULT 0,
      opened_count INT DEFAULT 0,
      clicked_count INT DEFAULT 0,
      conversion_count INT DEFAULT 0,
      open_rate DECIMAL(5,2) DEFAULT 0.00,
      click_rate DECIMAL(5,2) DEFAULT 0.00,
      conversion_rate DECIMAL(5,2) DEFAULT 0.00,
      engagement_score DECIMAL(5,2) DEFAULT 0.00,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      
      FOREIGN KEY (test_id) REFERENCES ab_tests(id) ON DELETE CASCADE,
      FOREIGN KEY (template_id) REFERENCES notification_templates(id) ON DELETE SET NULL,
      INDEX idx_test_id (test_id),
      INDEX idx_is_control (is_control),
      INDEX idx_conversion_rate (conversion_rate)
    )
  `);

  // A/B test participants table
  await query(`
    CREATE TABLE IF NOT EXISTS ab_test_participants (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      test_id CHAR(36) NOT NULL,
      variant_id CHAR(36) NOT NULL,
      subscription_id CHAR(36) NOT NULL,
      notification_id CHAR(36) NULL,
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      converted_at TIMESTAMP NULL,
      conversion_value DECIMAL(10,2) DEFAULT 0.00,
      
      FOREIGN KEY (test_id) REFERENCES ab_tests(id) ON DELETE CASCADE,
      FOREIGN KEY (variant_id) REFERENCES ab_test_variants(id) ON DELETE CASCADE,
      FOREIGN KEY (subscription_id) REFERENCES push_subscriptions(id) ON DELETE CASCADE,
      UNIQUE KEY unique_participant (test_id, subscription_id),
      INDEX idx_test_id (test_id),
      INDEX idx_variant_id (variant_id),
      INDEX idx_subscription_id (subscription_id)
    )
  `);

  console.log('✅ Webhooks and A/B testing tables created');
};

const down = async () => {
  await query('DROP TABLE IF EXISTS ab_test_participants');
  await query('DROP TABLE IF EXISTS ab_test_variants');
  await query('DROP TABLE IF EXISTS ab_tests');
  await query('DROP TABLE IF EXISTS webhook_deliveries');
  await query('DROP TABLE IF EXISTS webhooks');
  console.log('✅ Webhooks and A/B testing tables dropped');
};

module.exports = { up, down };