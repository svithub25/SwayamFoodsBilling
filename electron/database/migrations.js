import fs from 'fs';
import path from 'path';

export function runMigrations(db) {
  console.log(' Checking database migrations...');

  // Create migrations tracking table
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      migration_name TEXT NOT NULL UNIQUE,
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Helper function to check if column exists
  const columnExists = (tableName, columnName) => {
    const tableInfo = db.prepare(`PRAGMA table_info(${tableName})`).all();
    return tableInfo.some(col => col.name === columnName);
  };

  // Helper function to check if table exists
  const tableExists = (tableName) => {
    const result = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name=?
    `).get(tableName);
    return !!result;
  };

  // Helper function to mark migration as complete
  const markMigrationComplete = (migrationName) => {
    db.prepare('INSERT OR IGNORE INTO schema_migrations (migration_name) VALUES (?)').run(migrationName);
  };

  // Helper function to check if migration was run
  const migrationExists = (migrationName) => {
    const result = db.prepare('SELECT * FROM schema_migrations WHERE migration_name = ?').get(migrationName);
    return !!result;
  };

  // ========================================
  // MIGRATION 1: Add is_locked to opening_stock
  // ========================================
  const migration1 = 'add_is_locked_to_opening_stock';
  if (!migrationExists(migration1)) {
    console.log(` Running migration: ${migration1}`);
    try {
      if (tableExists('opening_stock')) {
        if (!columnExists('opening_stock', 'is_locked')) {
          db.exec(`ALTER TABLE opening_stock ADD COLUMN is_locked INTEGER DEFAULT 0;`);
          console.log('    Added is_locked column to opening_stock');
        }
        if (!columnExists('opening_stock', 'updated_at')) {
          db.exec(`ALTER TABLE opening_stock ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;`);
          console.log('    Added updated_at column to opening_stock');
        }
      }
      markMigrationComplete(migration1);
      console.log(` Migration ${migration1} completed`);
    } catch (error) {
      console.error(` Migration ${migration1} failed:`, error.message);
    }
  }


  // ========================================
  // MIGRATION 3: Ensure bank_accounts has status_code
  // ========================================
  const migration3 = 'ensure_bank_accounts_status_code';
  if (!migrationExists(migration3)) {
    console.log(` Running migration: ${migration3}`);
    try {
      if (tableExists('bank_accounts')) {
        if (!columnExists('bank_accounts', 'status_code')) {
          db.exec(`ALTER TABLE bank_accounts ADD COLUMN status_code INTEGER DEFAULT 0;`);
          console.log('    Added status_code column to bank_accounts');
        }
      }
      markMigrationComplete(migration3);
      console.log(` Migration ${migration3} completed`);
    } catch (error) {
      console.error(` Migration ${migration3} failed:`, error.message);
    }
  }

 

  // ========================================
  // MIGRATION 6: Ensure Cash account exists
  // ========================================
  const migration6 = 'ensure_cash_account_exists';
  if (!migrationExists(migration6)) {
    console.log(` Running migration: ${migration6}`);
    try {
      if (tableExists('bank_accounts')) {
        const cashAccount = db.prepare("SELECT * FROM bank_accounts WHERE account_name = 'Cash'").get();
        if (!cashAccount) {
          db.prepare(`
            INSERT INTO bank_accounts 
            (account_name, account_number, bank_name, branch_name, ifsc_code, account_type, opening_balance, current_balance, is_active, status_code)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run('Cash', 'CASH-001', 'Cash in Hand', 'N/A', 'N/A', 'Current', 0, 0, 1, 0);
          console.log('    Created default Cash account');
        }
      }
      markMigrationComplete(migration6);
      console.log(` Migration ${migration6} completed`);
    } catch (error) {
      console.error(` Migration ${migration6} failed:`, error.message);
    }
  }

  

  // ========================================
  // MIGRATION 9: Remove closing_stock table (deprecated)
  // ========================================
  const migration9 = 'deprecate_closing_stock_table';
  if (!migrationExists(migration9)) {
    console.log(` Running migration: ${migration9}`);
    try {
      if (tableExists('closing_stock')) {
        // Backup data before dropping (optional)
        const closingStockData = db.prepare('SELECT COUNT(*) as count FROM closing_stock').get();
        if (closingStockData.count > 0) {
          console.log(`Warning: closing_stock table has ${closingStockData.count} records`);
          console.log('Consider migrating this data to opening_stock before dropping');
          // Don't drop if it has data - just warn
          console.log('Skipping drop of closing_stock table (has data)');
        } else {
          // db.exec('DROP TABLE IF EXISTS closing_stock;');
          // console.log('Dropped deprecated closing_stock table');
          console.log('closing_stock table exists but is empty');
        }
      }
      markMigrationComplete(migration9);
      console.log(`Migration ${migration9} completed`);
    } catch (error) {
      console.error(` Migration ${migration9} failed:`, error.message);
    }
  }

  // ========================================
  // MIGRATION 10: Add missing columns to existing tables
  // ========================================
  const migration10 = 'add_missing_columns_to_tables';
  if (!migrationExists(migration10)) {
    console.log(`Running migration: ${migration10}`);
    try {
      // Add customer_rate to sale_items if missing
      if (tableExists('sale_items') && !columnExists('sale_items', 'customer_rate')) {
        db.exec(`ALTER TABLE sale_items ADD COLUMN customer_rate REAL DEFAULT 0;`);
        console.log('Added customer_rate column to sale_items');
      }

      // Add salesman_rate to sale_items if missing
      if (tableExists('sale_items') && !columnExists('sale_items', 'salesman_rate')) {
        db.exec(`ALTER TABLE sale_items ADD COLUMN salesman_rate REAL DEFAULT 0;`);
        console.log('Added salesman_rate column to sale_items');
      }

      // Add sale_type to sale_items if missing
      if (tableExists('sale_items') && !columnExists('sale_items', 'sale_type')) {
        db.exec(`ALTER TABLE sale_items ADD COLUMN sale_type TEXT DEFAULT 'customer';`);
        console.log('Added sale_type column to sale_items');
      }

      // Add is_approved to sales if missing
      if (tableExists('sales') && !columnExists('sales', 'is_approved')) {
        db.exec(`ALTER TABLE sales ADD COLUMN is_approved INTEGER DEFAULT 0;`);
        console.log(' Added is_approved column to sales');
      }

      // Add salesman_id to sales if missing
      if (tableExists('sales') && !columnExists('sales', 'salesman_id')) {
        db.exec(`ALTER TABLE sales ADD COLUMN salesman_id INTEGER DEFAULT NULL;`);
        console.log(' Added salesman_id column to sales');
      }

      // Add sale_type to sales if missing
      if (tableExists('sales') && !columnExists('sales', 'sale_type')) {
        db.exec(`ALTER TABLE sales ADD COLUMN sale_type TEXT DEFAULT 'customer';`);
        console.log('    Added sale_type column to sales');
      }

      markMigrationComplete(migration10);
      console.log(` Migration ${migration10} completed`);
    } catch (error) {
      console.error(` Migration ${migration10} failed:`, error.message);
    }
  }

  console.log(' All migrations completed successfully!');
  
  // Print migration summary
  const completedMigrations = db.prepare('SELECT COUNT(*) as count FROM schema_migrations').get();
  console.log(` Total migrations completed: ${completedMigrations.count}`);
}