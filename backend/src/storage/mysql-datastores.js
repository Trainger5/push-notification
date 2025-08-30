const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { query, transaction } = require('../config/database');

// MySQL-based datastore implementation
class MySQLDatastore {
  constructor(tableName, primaryKey = 'id') {
    this.tableName = tableName;
    this.primaryKey = primaryKey;
  }

  // Find one document
  async findOne(conditions = {}) {
    const { sql, params } = this.buildSelectQuery(conditions, 1);
    const results = await query(sql, params);
    return results.length > 0 ? results[0] : null;
  }

  // Find multiple documents
  async find(conditions = {}, options = {}) {
    const { sql, params } = this.buildSelectQuery(conditions, options.limit, options.skip, options.sort);
    return await query(sql, params);
  }

  // Count documents
  async count(conditions = {}) {
    const { whereClause, params } = this.buildWhereClause(conditions);
    const sql = `SELECT COUNT(*) as count FROM ${this.tableName}${whereClause}`;
    const results = await query(sql, params);
    return results[0].count;
  }

  // Insert a new document
  async insert(document) {
    if (!document.id && this.primaryKey === 'id') {
      document.id = uuidv4();
    }
    
    const columns = Object.keys(document);
    const values = Object.values(document);
    const placeholders = values.map(() => '?').join(', ');
    
    const sql = `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
    await query(sql, values);
    
    return document;
  }

  // Update documents
  async update(conditions, updateData, options = {}) {
    const updateFields = [];
    const params = [];

    // Handle different update operators
    if (updateData.$set) {
      Object.entries(updateData.$set).forEach(([key, value]) => {
        updateFields.push(`${key} = ?`);
        params.push(value);
      });
    } else {
      // Direct update
      Object.entries(updateData).forEach(([key, value]) => {
        if (key !== this.primaryKey) { // Don't update primary key
          updateFields.push(`${key} = ?`);
          params.push(value);
        }
      });
    }

    if (updateFields.length === 0) {
      return 0; // No fields to update
    }

    const { whereClause, params: whereParams } = this.buildWhereClause(conditions);
    params.push(...whereParams);

    const sql = `UPDATE ${this.tableName} SET ${updateFields.join(', ')}${whereClause}`;
    const result = await query(sql, params);
    
    return result.affectedRows || 0;
  }

  // Remove documents
  async remove(conditions) {
    const { whereClause, params } = this.buildWhereClause(conditions);
    const sql = `DELETE FROM ${this.tableName}${whereClause}`;
    const result = await query(sql, params);
    
    return result.affectedRows || 0;
  }

  // Build WHERE clause from conditions
  buildWhereClause(conditions) {
    if (!conditions || Object.keys(conditions).length === 0) {
      return { whereClause: '', params: [] };
    }

    const whereParts = [];
    const params = [];

    Object.entries(conditions).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        whereParts.push(`${key} IS NULL`);
      } else if (typeof value === 'object' && value !== null) {
        // Handle operators like $in, $gte, $lte, etc.
        Object.entries(value).forEach(([operator, operatorValue]) => {
          switch (operator) {
            case '$in':
              if (Array.isArray(operatorValue) && operatorValue.length > 0) {
                const placeholders = operatorValue.map(() => '?').join(', ');
                whereParts.push(`${key} IN (${placeholders})`);
                params.push(...operatorValue);
              }
              break;
            case '$gte':
              whereParts.push(`${key} >= ?`);
              params.push(operatorValue);
              break;
            case '$gt':
              whereParts.push(`${key} > ?`);
              params.push(operatorValue);
              break;
            case '$lte':
              whereParts.push(`${key} <= ?`);
              params.push(operatorValue);
              break;
            case '$lt':
              whereParts.push(`${key} < ?`);
              params.push(operatorValue);
              break;
            case '$ne':
              whereParts.push(`${key} != ?`);
              params.push(operatorValue);
              break;
            case '$exists':
              if (operatorValue) {
                whereParts.push(`${key} IS NOT NULL`);
              } else {
                whereParts.push(`${key} IS NULL`);
              }
              break;
            default:
              whereParts.push(`${key} = ?`);
              params.push(operatorValue);
          }
        });
      } else {
        whereParts.push(`${key} = ?`);
        params.push(value);
      }
    });

    const whereClause = whereParts.length > 0 ? ' WHERE ' + whereParts.join(' AND ') : '';
    return { whereClause, params };
  }

  // Build SELECT query
  buildSelectQuery(conditions = {}, limit = null, skip = null, sort = null) {
    const { whereClause, params } = this.buildWhereClause(conditions);
    
    let sql = `SELECT * FROM ${this.tableName}${whereClause}`;
    
    // Handle sorting
    if (sort) {
      const sortParts = [];
      Object.entries(sort).forEach(([key, direction]) => {
        sortParts.push(`${key} ${direction === -1 ? 'DESC' : 'ASC'}`);
      });
      if (sortParts.length > 0) {
        sql += ` ORDER BY ${sortParts.join(', ')}`;
      }
    }
    
    // Handle limit and skip
    if (limit) {
      sql += ` LIMIT ${limit}`;
      if (skip) {
        sql += ` OFFSET ${skip}`;
      }
    }
    
    return { sql, params };
  }
}

// Stores object that mirrors the NeDB interface
let stores = null;

function getMySQLDatastores() {
  if (stores) return stores;
  
  stores = {
    users: new MySQLDatastore('users'),
    customers: new MySQLDatastore('customers'),
    apiKeys: new MySQLDatastore('api_keys'),
    subscriptions: new MySQLDatastore('push_subscriptions'),
    pushSettings: new MySQLDatastore('push_settings'),
    notifications: new MySQLDatastore('notifications'),
    scheduledNotifications: new MySQLDatastore('scheduled_notifications'),
    notificationTemplates: new MySQLDatastore('notification_templates'),
    userSegments: new MySQLDatastore('user_segments'),
    metrics: new MySQLDatastore('metrics', 'id'),
    webhooks: new MySQLDatastore('webhooks'),
    webhookDeliveries: new MySQLDatastore('webhook_deliveries', 'id'),
    abTests: new MySQLDatastore('ab_tests'),
    abTestVariants: new MySQLDatastore('ab_test_variants'),
    abTestParticipants: new MySQLDatastore('ab_test_participants', 'id'),
    campaigns: new MySQLDatastore('campaigns'),
    campaignExecutions: new MySQLDatastore('campaign_executions'),
    notificationDeliveries: new MySQLDatastore('notification_deliveries', 'id'),
    analyticsSummaries: new MySQLDatastore('analytics_summaries', 'id'),
    segmentMemberships: new MySQLDatastore('segment_memberships', 'id')
  };
  
  return stores;
}

// Seed admin user function (MySQL version)
async function seedAdminIfMissing() {
  const datastores = getMySQLDatastores();
  const { users, customers } = datastores;
  
  // Seed admin user
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  
  let admin = await users.findOne({ email: adminEmail, role: 'admin' });
  if (!admin) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    admin = await users.insert({
      email: adminEmail,
      password_hash: passwordHash,
      role: 'admin',
      email_verified: true,
      created_at: new Date()
    });
    console.log('✅ Admin user created');
  }
  
  // Seed demo customer user
  const demoEmail = 'demo@customer.com';
  const demoPassword = 'password123';
  
  let demoUser = await users.findOne({ email: demoEmail, role: 'customer' });
  if (!demoUser) {
    const passwordHash = await bcrypt.hash(demoPassword, 12);
    demoUser = await users.insert({
      email: demoEmail,
      password_hash: passwordHash,
      role: 'customer',
      email_verified: true,
      created_at: new Date()
    });
    
    // Create demo customer record
    const existingCustomer = await customers.findOne({ user_id: demoUser.id });
    if (!existingCustomer) {
      const demoCustomer = {
        user_id: demoUser.id,
        name: 'Demo Company',
        email: demoEmail,
        company_name: 'Demo Company Inc.',
        country: 'US',
        plan: 'pro',
        api_key: 'demo_' + Math.random().toString(36).substr(2, 15),
        status: 'active',
        subscriber_limit: 10000,
        monthly_quota: 100000,
        created_at: new Date()
      };
      await customers.insert(demoCustomer);
      console.log('✅ Demo customer created');
    }
  }
  
  return admin;
}

module.exports = { 
  getMySQLDatastores, 
  seedAdminIfMissing,
  MySQLDatastore
};