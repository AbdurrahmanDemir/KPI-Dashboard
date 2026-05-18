/**
 * Import Data Cleanup Script
 *
 * Deletes ALL imported analytics data so fresh data can be re-uploaded from
 * the site. User accounts and system configuration tables are left completely
 * untouched.
 *
 * Usage: npm run cleanup:imports
 *
 * Tables preserved (NOT touched):
 *   users, refresh_tokens, audit_logs, saved_views, segments,
 *   report_schedules, integrations, channel_mapping
 *
 * Tables truncated (analytics / import data):
 *   import_raw_rows, import_staging_rows, import_logs, kpi_cache,
 *   sales_data, ads_data, traffic_data, campaign_data,
 *   customer_data, funnel_data, utm_links, utm_events
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const { QueryTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Load all models so Sequelize is fully initialised
require('../models/index');

// ─── Tables to wipe ──────────────────────────────────────────────────────────
// Order matters: child tables (FK dependants) come before parent tables so
// that FOREIGN_KEY_CHECKS = 0 is the only safety net needed.
const TRUNCATE_TABLES = [
    // Import pipeline
    'import_raw_rows',
    'import_staging_rows',
    'import_logs',
    // Cache
    'kpi_cache',
    // Analytics / imported data
    'sales_data',
    'ads_data',
    'traffic_data',
    'campaign_data',
    'customer_data',
    'funnel_data',
    'utm_links',
    'utm_events',
];

// ─── Tables to optimise (reclaim fragmented space) ───────────────────────────
// These are the preserved system/user tables — we optimise them but never
// truncate them.
const OPTIMIZE_TABLES = [
    'users',
    'refresh_tokens',
    'audit_logs',
    'saved_views',
    'segments',
    'report_schedules',
    'integrations',
    'channel_mapping',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Main ─────────────────────────────────────────────────────────────────────

const cleanupImports = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connection established.\n');

        await logDiskUsage('BEFORE');
        console.log();

        // ── Safety confirmation ──────────────────────────────────────────────
        console.log('⚠️  The following tables will be PERMANENTLY truncated:');
        TRUNCATE_TABLES.forEach((t) => console.log(`      • ${t}`));
        console.log();
        console.log('🔒 The following tables will NOT be touched:');
        OPTIMIZE_TABLES.forEach((t) => console.log(`      • ${t}`));
        console.log();

        // ── Truncate analytics / import tables ──────────────────────────────
        console.log('🗑️  Truncating analytics and import data tables...');
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

        for (const table of TRUNCATE_TABLES) {
            await sequelize.query(`TRUNCATE TABLE \`${table}\``);
            console.log(`   ✓ ${table} cleared`);
        }

        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log();

        // ── Optimise truncated tables ────────────────────────────────────────
        console.log('🔧 Running OPTIMIZE TABLE on cleared tables...');
        for (const table of TRUNCATE_TABLES) {
            try {
                await sequelize.query(`OPTIMIZE TABLE \`${table}\``);
                console.log(`   ✓ ${table} optimized`);
            } catch (err) {
                console.warn(`   ⚠  ${table} could not be optimized: ${err.message}`);
            }
        }
        console.log();

        // ── Optimise preserved tables ────────────────────────────────────────
        console.log('🔧 Running OPTIMIZE TABLE on preserved system tables...');
        for (const table of OPTIMIZE_TABLES) {
            try {
                await sequelize.query(`OPTIMIZE TABLE \`${table}\``);
                console.log(`   ✓ ${table} optimized`);
            } catch (err) {
                console.warn(`   ⚠  ${table} could not be optimized: ${err.message}`);
            }
        }
        console.log();

        await logDiskUsage('AFTER');
        console.log('\n🎉 Import data cleanup complete! You can now re-upload fresh data.');
        process.exit(0);
    } catch (error) {
        // Always re-enable FK checks even on failure
        try {
            await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
        } catch (_) {
            // ignore secondary cleanup failure
        }
        console.error('❌ Cleanup failed:', error.message);
        if (error.parent) {
            console.error('   SQL error:', error.parent.sqlMessage || error.parent.message);
        }
        process.exit(1);
    }
};

cleanupImports();
