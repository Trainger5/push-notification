const fs = require('fs');
const path = require('path');
const { createDatabase, query, testConnection } = require('../config/database');

// Migration runner
class MigrationRunner {
  constructor() {
    this.migrationsPath = __dirname;
  }

  async run() {
    try {
      console.log('🚀 Starting database migration process...');
      
      // Create database first
      await createDatabase();
      
      // Test connection
      const connected = await testConnection();
      if (!connected) {
        throw new Error('Failed to connect to database');
      }

      // Create migrations table if it doesn't exist
      await this.createMigrationsTable();

      // Get migration files
      const migrationFiles = this.getMigrationFiles();
      console.log(`📁 Found ${migrationFiles.length} migration files`);

      // Run migrations in order
      for (const file of migrationFiles) {
        await this.runMigration(file);
      }

      console.log('✅ All migrations completed successfully');
    } catch (error) {
      console.error('❌ Migration failed:', error.message);
      console.error(error.stack);
      process.exit(1);
    }
  }

  async createMigrationsTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await query(sql);
    console.log('📝 Migrations tracking table ready');
  }

  getMigrationFiles() {
    const files = fs.readdirSync(this.migrationsPath)
      .filter(file => file.match(/^\d+_.*\.js$/) && file !== 'run-migrations.js')
      .sort();
    return files;
  }

  async runMigration(filename) {
    try {
      // Check if migration already executed
      const executed = await query('SELECT name FROM migrations WHERE name = ?', [filename]);
      if (executed.length > 0) {
        console.log(`⏭️  Skipping ${filename} (already executed)`);
        return;
      }

      console.log(`🔄 Running migration: ${filename}`);
      
      // Load and execute migration
      const migration = require(path.join(this.migrationsPath, filename));
      await migration.up();
      
      // Record successful migration
      await query('INSERT INTO migrations (name) VALUES (?)', [filename]);
      
      console.log(`✅ Migration ${filename} completed`);
    } catch (error) {
      console.error(`❌ Migration ${filename} failed:`, error.message);
      throw error;
    }
  }

  async rollback(filename) {
    try {
      console.log(`🔄 Rolling back migration: ${filename}`);
      
      const migration = require(path.join(this.migrationsPath, filename));
      if (migration.down) {
        await migration.down();
        await query('DELETE FROM migrations WHERE name = ?', [filename]);
        console.log(`✅ Migration ${filename} rolled back`);
      } else {
        console.log(`⚠️  No rollback method found for ${filename}`);
      }
    } catch (error) {
      console.error(`❌ Rollback ${filename} failed:`, error.message);
      throw error;
    }
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  const runner = new MigrationRunner();
  runner.run();
}

module.exports = MigrationRunner;