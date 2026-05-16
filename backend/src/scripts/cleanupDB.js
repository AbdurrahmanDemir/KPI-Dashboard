/**
 * Database Cleanup Script
 * Truncates the sales_data table to free up storage space.
 * Resolves "The table 'sales_data' is full" errors caused by hitting
 * MySQL table/storage limits.
 *
 * Usage: npm run cleanup
 *
 * NOTE: This is a temporary measure until a proper data archival or
 * retention policy is implemented. Running this script will permanently
 * delete all rows in sales_data — re-seed afterwards if needed.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const { sequelize } = require('../config/database');

// Load all models so Sequelize is fully initialised
require('../models/index');

const cleanupDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Veritabanı bağlantısı başarılı.\n');

        // TRUNCATE is faster than DELETE and resets the auto-increment counter.
        // Foreign-key checks are disabled temporarily so the operation succeeds
        // even when other tables reference sales_data rows.
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
        await sequelize.query('TRUNCATE TABLE `sales_data`');
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log('🗑️  sales_data tablosu başarıyla temizlendi.');
        console.log('🎉 Cleanup tamamlandı!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Cleanup hatası:', error.message);
        if (error.parent) {
            console.error('   SQL Hatası:', error.parent.sqlMessage || error.parent.message);
        }
        process.exit(1);
    }
};

cleanupDB();
