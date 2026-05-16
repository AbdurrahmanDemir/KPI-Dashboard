/**
 * Database Cleanup Script
 * Truncates ALL data tables to free up storage space.
 * Resolves "The table '...' is full" errors caused by hitting MySQL
 * table/storage limits across multiple tables (users, sales_data, etc.).
 *
 * Usage: npm run cleanup
 *
 * Tables truncated (child → parent order, FK checks disabled):
 *   import_raw_rows, import_staging_rows, sales_data, ads_data,
 *   traffic_data, funnel_data, customer_data, campaign_data,
 *   utm_events, utm_links, import_logs, users
 *
 * NOTE: The seed script (npm run seed) must be run after cleanup to
 * repopulate the users table with admin accounts.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const { sequelize } = require('../config/database');

// Load all models so Sequelize is fully initialised
require('../models/index');

// Tables to truncate, ordered so child tables come before their parents.
// Foreign-key checks are disabled for the entire operation, but keeping
// this order makes the intent explicit and safe if checks are ever re-enabled.
const TABLES = [
    // Import child rows first (reference import_logs)
    'import_raw_rows',
    'import_staging_rows',
    // Data tables that reference import_logs
    'sales_data',
    'ads_data',
    'traffic_data',
    'funnel_data',
    'customer_data',
    'campaign_data',
    // UTM child rows before parent
    'utm_events',
    'utm_links',
    // Parent tables
    'import_logs',
    // Users last — seed will recreate admin accounts
    'users',
];

const cleanupDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Veritabanı bağlantısı başarılı.\n');

        // Disable FK checks so TRUNCATE succeeds regardless of reference order
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
        console.log('🔓 Foreign key checks devre dışı bırakıldı.\n');

        for (const table of TABLES) {
            await sequelize.query(`TRUNCATE TABLE \`${table}\``);
            console.log(`🗑️  ${table} tablosu temizlendi.`);
        }

        // Re-enable FK checks
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('\n🔒 Foreign key checks yeniden etkinleştirildi.');

        console.log(`\n✅ ${TABLES.length} tablo başarıyla temizlendi.`);
        console.log('🎉 Cleanup tamamlandı!');
        process.exit(0);
    } catch (error) {
        // Always restore FK checks even on failure
        try { await sequelize.query('SET FOREIGN_KEY_CHECKS = 1'); } catch (_) {}
        console.error('❌ Cleanup hatası:', error.message);
        if (error.parent) {
            console.error('   SQL Hatası:', error.parent.sqlMessage || error.parent.message);
        }
        process.exit(1);
    }
};

cleanupDB();
