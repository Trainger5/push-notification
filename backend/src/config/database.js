const mysql = require('mysql2/promise');
const path = require('path');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'push_notification_system',
  port: process.env.DB_PORT || 3306,
  charset: 'utf8mb4',
  timezone: '+00:00',
  // Connection pool settings only
  connectionLimit: 10,
  queueLimit: 0
};

// Connection pool
let pool = null;

function getPool() {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  return pool;
}

// Get a connection from the pool
async function getConnection() {
  const pool = getPool();
  return await pool.getConnection();
}

// Execute a query
async function query(sql, params = []) {
  const connection = await getConnection();
  try {
    const [rows, fields] = await connection.execute(sql, params);
    return rows;
  } finally {
    connection.release();
  }
}

// Execute multiple queries in a transaction
async function transaction(queries) {
  const connection = await getConnection();
  try {
    await connection.beginTransaction();
    
    const results = [];
    for (const { sql, params } of queries) {
      const [rows] = await connection.execute(sql, params || []);
      results.push(rows);
    }
    
    await connection.commit();
    return results;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// Test database connection
async function testConnection() {
  try {
    const connection = await getConnection();
    console.log('✅ Database connection successful');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// Create database if it doesn't exist
async function createDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      port: dbConfig.port
    });
    
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`✅ Database '${dbConfig.database}' created or already exists`);
    
    await connection.end();
  } catch (error) {
    console.error('❌ Failed to create database:', error.message);
    throw error;
  }
}

// Close all connections
async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('✅ Database pool closed');
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await closePool();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closePool();
  process.exit(0);
});

module.exports = {
  getPool,
  getConnection,
  query,
  transaction,
  testConnection,
  createDatabase,
  closePool,
  dbConfig
};