/**
 * Database Cleanup Script
 *
 * Resolves InnoDB "no space left on device" (OS error 28) failures caused by
 * accumulated data in the import pipeline and KPI cache tables.
 *
 * Strategy
 * --------
 * 1. TRUNCATE the four heavy tables that accumulate unbounded data:
 *      - import_raw_rows    (child of import_logs — stores every raw CSV/XLSX row)
 *      - import_staging_rows (child of import_logs — stores every normalised row)
 *      - import_logs        (parent — safe to clear once children are gone)
 *      - kpi_cache          (computed cache — fully regenerable on next request)
 *    All other tables (users, sales_data, ads_data, …) are left untouched.
 *
 * 2. OPTIMIZE TABLE on every remaining table to release fragmented InnoDB pages
 *    back to the filesystem so InnoDB can resize its redo logs.
 *
 * 3. Log disk-space usage (information_schema) before and after so the freed
 *    space is visible in the run output.
 *
 * Usage: npm run cleanup
 *
 * Expected outcome: 1–2 GB freed, InnoDB redo-log resize unblocked.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const { sequelize } = require('../config/database');

// Load all models so Sequelize is fully initialised
require('../models/index');

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Query information_schema for the total allocated size (data + index) of
 * every table in the current database, in megabytes.
 */
const getDiskUsageMB = async () => {
    const dbName = process.env.DB_NAME;
    const [[result]] = await sequelize.query(
        `SELECT
            ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS total_mb,
            ROUND(SUM(data_free)                  / 1024 / 1024, 2) AS free_mb
         FROM information_schema.TABLES
         WHERE table_schema = :dbName`,
        { replacements: { dbName }, type: sequelize.QueryTypes.SELECT }
    );
    return result;
};

/**
 * Print a formatted disk-usage snapshot.
 */
const logDiskUsage = async (label) => {
    const { total_mb, free_mb } = await getDiskUsageMB();
    console.log(`📊 [${label}] Allocated: ${total_mb} MB  |  Fragmented (reclaimable): ${free_mb} MB`);
};

// ─── Tables to TRUNCATE (heavy accumulation tables) ─────────────────────────

// Order matters: children before parent to satisfy FK constraints even when
// FOREIGN_KEY_CHECKS is re-enabled between steps.
const TRUNCATE_TABLES = [
    'import_raw_rows',     // child of import_logs — largest table by far
    'import_staging_rows', // child of import_logs — second largest
    'import_logs',         // parent — safe once children are cleared
    'kpi_cache',           // computed cache — fully regenerable
];

// ─── Tables to OPTIMIZE (defragment without data loss) ──────────────────────

// Every table that is NOT being truncated. OPTIMIZE TABLE rebuilds the InnoDB
// tablespace file, releasing fragmented pages back to the OS.
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

// ─── Main ────────────────────────────────────────────────────────────────────

const cleanupDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Veritabanı bağlantısı başarılı.\n');

        // ── Step 1: Disk usage BEFORE ────────────────────────────────────────
        await logDiskUsage('BEFORE');
        console.log();

        // ── Step 2: Truncate heavy accumulation tables ────────────────────────
        console.log('🗑️  Ağır tabloları temizleniyor (TRUNCATE)…');
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

        for (const table of TRUNCATE_TABLES) {
            await sequelize.query(`TRUNCATE TABLE \`${table}\``);
            console.log(`   ✓ ${table} temizlendi`);
        }

        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log();

        // ── Step 3: Optimize remaining tables ────────────────────────────────
        console.log('🔧 Kalan tablolar optimize ediliyor (OPTIMIZE TABLE)…');
        for (const table of OPTIMIZE_TABLES) {
            try {
                await sequelize.query(`OPTIMIZE TABLE \`${table}\``);
                console.log(`   ✓ ${table} optimize edildi`);
            } catch (optErr) {
                // Non-fatal — log and continue so one bad table doesn't abort the rest
                console.warn(`   ⚠️  ${table} optimize edilemedi: ${optErr.message}`);
            }
        }
        console.log();

        // ── Step 4: Disk usage AFTER ─────────────────────────────────────────
        await logDiskUsage('AFTER');
        console.log();

        console.log('🎉 Cleanup tamamlandı! InnoDB redo log yeniden boyutlandırılabilir.');
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
