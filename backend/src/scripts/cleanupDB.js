/**
 * Import Data Cleanup Script
 *
 * Removes imported and derived analytics data so the app can be reused with a
 * clean dataset while keeping accounts and configuration intact.
 *
 * Usage:
 * - npm run cleanup
 * - npm run cleanup:imports
 *
 * Preserves:
 * - users
 * - audit_logs
 * - saved_views
 * - segments
 * - refresh_tokens
 * - report_schedules
 * - integrations
 * - utm_links
 * - utm_events
 *
 * Removes:
 * - imported dataset tables
 * - import pipeline tables
 * - kpi cache
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const { QueryTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Load all models so Sequelize is fully initialised.
require('../models/index');

const TRUNCATE_TABLES = [
    'sales_data',
    'ads_data',
    'traffic_data',
    'campaign_data',
    'funnel_data',
    'customer_data',
    'channel_mapping',
    'import_raw_rows',
    'import_staging_rows',
    'import_logs',
    'kpi_cache',
];

const OPTIMIZE_TABLES = [
    'users',
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
    console.log(`[${label}] Allocated: ${usage.total_mb} MB | Fragmented: ${usage.free_mb} MB`);
};

const cleanupDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connection successful.\n');

        await logDiskUsage('BEFORE');
        console.log();

        console.log('Removing imported data, import logs, and KPI cache...');
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

        for (const table of TRUNCATE_TABLES) {
            await sequelize.query(`TRUNCATE TABLE \`${table}\``);
            console.log(`   cleared ${table}`);
        }

        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log();

        console.log('Optimizing preserved tables...');
        for (const table of OPTIMIZE_TABLES) {
            try {
                await sequelize.query(`OPTIMIZE TABLE \`${table}\``);
                console.log(`   optimized ${table}`);
            } catch (error) {
                console.warn(`   could not optimize ${table}: ${error.message}`);
            }
        }
        console.log();

        await logDiskUsage('AFTER');
        console.log('\nImport cleanup completed.');
        process.exit(0);
    } catch (error) {
        try {
            await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
        } catch (_) {
            // Ignore secondary cleanup failure.
        }

        console.error('Cleanup failed:', error.message);
        if (error.parent) {
            console.error('   SQL error:', error.parent.sqlMessage || error.parent.message);
        }
        process.exit(1);
    }
};

cleanupDB();
