/**
 * Database Cleanup Script
 *
 * Resolves InnoDB "no space left on device" (OS error 28) failures caused by
 * accumulated data in import pipeline tables and cache tables.
 *
 * Usage: npm run cleanup
 *
 * Safe scope:
 * - Clears only import pipeline tables and KPI cache
 * - Leaves users and core analytics tables untouched
 * - Attempts OPTIMIZE TABLE afterwards to reclaim fragmented space
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const { QueryTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Load all models so Sequelize is fully initialised
require('../models/index');

const TRUNCATE_TABLES = [
    'import_raw_rows',
    'import_staging_rows',
    'import_logs',
    'kpi_cache',
];

const OPTIMIZE_TABLES = [
    'users',
    'sales_data',
    'ads_data',
    'traffic_data',
    'campaign_data',
    'funnel_data',
    'customer_data',
    'channel_mapping',
    'saved_views',
    'segments',
    'audit_logs',
    'refresh_tokens',
    'report_schedules',
    'integrations',
    'utm_links',
    'utm_events',
];

const getDiskUsage = async () => {
    const [result] = await sequelize.query(
        `SELECT
            ROUND(COALESCE(SUM(data_length + index_length), 0) / 1024 / 1024, 2) AS total_mb,
            ROUND(COALESCE(SUM(data_free), 0) / 1024 / 1024, 2) AS free_mb
         FROM information_schema.TABLES
         WHERE table_schema = :dbName`,
        {
            replacements: { dbName: process.env.DB_NAME },
            type: QueryTypes.SELECT,
        }
    );

    return result;
};

const logDiskUsage = async (label) => {
    const usage = await getDiskUsage();
    console.log(
        `📊 [${label}] Allocated: ${usage.total_mb} MB | Fragmented: ${usage.free_mb} MB`
    );
};

const cleanupDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Veritabanı bağlantısı başarılı.\n');

        await logDiskUsage('BEFORE');
        console.log();

        console.log('🗑️ Ağır import/cache tabloları temizleniyor...');
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

        for (const table of TRUNCATE_TABLES) {
            await sequelize.query(`TRUNCATE TABLE \`${table}\``);
            console.log(`   ✓ ${table} temizlendi`);
        }

        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log();

        console.log('🔧 Kalan tablolar optimize ediliyor...');
        for (const table of OPTIMIZE_TABLES) {
            try {
                await sequelize.query(`OPTIMIZE TABLE \`${table}\``);
                console.log(`   ✓ ${table} optimize edildi`);
            } catch (error) {
                console.warn(`   ⚠ ${table} optimize edilemedi: ${error.message}`);
            }
        }
        console.log();

        await logDiskUsage('AFTER');
        console.log('\n🎉 Cleanup tamamlandı!');
        process.exit(0);
    } catch (error) {
        try {
            await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
        } catch (_) {
            // ignore secondary cleanup failure
        }
        console.error('❌ Cleanup hatası:', error.message);
        if (error.parent) {
            console.error('   SQL Hatası:', error.parent.sqlMessage || error.parent.message);
        }
        process.exit(1);
    }
};

cleanupDB();
