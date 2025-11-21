#!/usr/bin/env node
/**
 * Quick script to view database table contents
 * Usage: node view-db.js [table_name]
 * If no table name provided, shows all tables
 */

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'ticket_booking_system.db');
const db = new Database(DB_PATH);

const tableName = process.argv[2];

if (tableName) {
  // View specific table
  try {
    const rows = db.prepare(`SELECT * FROM ${tableName}`).all();
    console.log(`\n=== ${tableName.toUpperCase()} (${rows.length} rows) ===\n`);
    
    if (rows.length === 0) {
      console.log('(No data)');
    } else {
      // Get column names
      const columns = Object.keys(rows[0]);
      console.log('Columns:', columns.join(' | '));
      console.log('-'.repeat(80));
      
      rows.forEach((row, idx) => {
        console.log(`\nRow ${idx + 1}:`);
        columns.forEach(col => {
          const value = row[col];
          const display = value === null ? '(null)' : String(value);
          console.log(`  ${col}: ${display}`);
        });
      });
    }
  } catch (error) {
    console.error(`Error viewing table "${tableName}":`, error.message);
    process.exit(1);
  }
} else {
  // List all tables and row counts
  const tables = db
    .prepare(
      `SELECT name FROM sqlite_master 
       WHERE type='table' AND name NOT LIKE 'sqlite_%' 
       ORDER BY name`
    )
    .all()
    .map(row => row.name);

  console.log('\n=== AVAILABLE TABLES ===\n');
  
  tables.forEach(table => {
    const count = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get().count;
    console.log(`  ${table.padEnd(25)} (${count} rows)`);
  });

  console.log('\n=== USAGE ===');
  console.log('  node view-db.js <table_name>  - View all data from a specific table');
  console.log('  node view-db.js users        - Example: View users table');
  console.log('  node view-db.js events        - Example: View events table');
  console.log('  node view-db.js bookings     - Example: View bookings table\n');
}

db.close();

