const { query } = require('../config/database');

const up = async () => {
  // Users table - for authentication
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('admin', 'customer') NOT NULL DEFAULT 'customer',
      email_verified BOOLEAN DEFAULT FALSE,
      verification_token VARCHAR(255) NULL,
      reset_token VARCHAR(255) NULL,
      reset_token_expires TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      last_login TIMESTAMP NULL,
      
      INDEX idx_email (email),
      INDEX idx_role (role),
      INDEX idx_verification_token (verification_token),
      INDEX idx_reset_token (reset_token)
    )
  `);

  // Customers table - business entities
  await query(`
    CREATE TABLE IF NOT EXISTS customers (
      id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
      user_id CHAR(36) NOT NULL,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      company_name VARCHAR(255) NULL,
      industry VARCHAR(100) NULL,
      country VARCHAR(2) NULL,
      timezone VARCHAR(50) DEFAULT 'UTC',
      plan ENUM('free', 'pro', 'enterprise') DEFAULT 'free',
      api_key VARCHAR(255) NOT NULL UNIQUE,
      status ENUM('active', 'suspended', 'cancelled') DEFAULT 'active',
      subscriber_limit INT DEFAULT 1000,
      monthly_quota INT DEFAULT 10000,
      quota_used INT DEFAULT 0,
      quota_reset_date DATE NULL,
      billing_email VARCHAR(255) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user_id (user_id),
      INDEX idx_api_key (api_key),
      INDEX idx_status (status),
      INDEX idx_plan (plan)
    )
  `);

  // API Keys table - for additional API access control
  await query(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
      customer_id CHAR(36) NOT NULL,
      key_hash VARCHAR(255) NOT NULL,
      name VARCHAR(100) NOT NULL,
      permissions JSON NULL,
      rate_limit INT DEFAULT 1000,
      last_used TIMESTAMP NULL,
      expires_at TIMESTAMP NULL,
      status ENUM('active', 'inactive', 'revoked') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
      INDEX idx_customer_id (customer_id),
      INDEX idx_key_hash (key_hash),
      INDEX idx_status (status),
      INDEX idx_expires_at (expires_at)
    )
  `);

  console.log('✅ Users, customers, and API keys tables created');
};

const down = async () => {
  await query('DROP TABLE IF EXISTS api_keys');
  await query('DROP TABLE IF EXISTS customers');
  await query('DROP TABLE IF EXISTS users');
  console.log('✅ Users, customers, and API keys tables dropped');
};

module.exports = { up, down };