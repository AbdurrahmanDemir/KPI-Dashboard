/**
 * Database Full-Reset Cleanup Script
 *
 * Resolves InnoDB "no space left on device" (OS error 28) by truncating
 * EVERY table in the database, then running OPTIMIZE TABLE on all of them
 * to reclaim fragmented space from the InnoDB tablespace.
 *
 * Usage: npm run cleanup
 *
 * Effect:
 * - ALL rows in ALL tables are deleted (schema/structure is preserved)
 * - Foreign key checks are disabled for the duration of the truncation
 * - OPTIMIZE TABLE is run on every table afterwards to defragment InnoDB
 * - Admin users will be recreated on next deploy via the seed script
 *
 * Expected space recovery: 4–5 GB
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const { QueryTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Load all models so Sequelize is fully initialised
require('../models/index');

// Truncation order: child tables before parent tables so that even without
// FK_CHECKS=0 the order would be safe. With FK_CHECKS=0 the order does not
// matter, but keeping it explicit makes the intent clear.
const ALL_TABLES = [
    // Import pipeline — children of import_logs
    'import_raw_rows',
    'import_staging_rows',

    // Analytics data — children of import_logs
    'sales_data',
    'ads_data',
    'traffic_data',
    'campaign_data',
    'customer_data',
    'funnel_data',
    'channel_mapping',

    // UTM — utm_events is a child of utm_links
    'utm_events',
    'utm_links',

    // User-owned data — children of users
    'kpi_cache',
    'audit_logs',
    'saved_views',
    'segments',
    'refresh_tokens',
    'report_schedules',
    'integrations',

    // Parent tables last
    'import_logs',
    'users',
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

        console.log(`🗑️  Tüm tablolar temizleniyor (${ALL_TABLES.length} tablo)...`);
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

        for (const table of ALL_TABLES) {
            await sequelize.query(`TRUNCATE TABLE \`${table}\``);
            console.log(`   ✓ ${table} temizlendi`);
        }

        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log();

        console.log('🔧 Tüm tablolar optimize ediliyor (fragmented space geri alınıyor)...');
        for (const table of ALL_TABLES) {
            try {
                await sequelize.query(`OPTIMIZE TABLE \`${table}\``);
                console.log(`   ✓ ${table} optimize edildi`);
            } catch (error) {
                console.warn(`   ⚠ ${table} optimize edilemedi: ${error.message}`);
            }
        }
        console.log();

        await logDiskUsage('AFTER');
        console.log('\n🎉 Full reset tamamlandı! Admin kullanıcılar bir sonraki deploy\'da seed scripti tarafından yeniden oluşturulacak.');
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
