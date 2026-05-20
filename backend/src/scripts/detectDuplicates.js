/**
 * Duplicate Detection Script
 *
 * Scans all data tables for duplicate records that may have been introduced
 * by uploading the same file more than once. Uses the same key-generation
 * logic as getDuplicateKey() in import.controller.js so results are
 * consistent with what the import pipeline itself considers a duplicate.
 *
 * Usage:
 *   npm run detect:duplicates
 *
 * Output:
 *   - All import_logs entries with timestamps and row counts
 *   - Per-table row counts broken down by import_id
 *   - Duplicate groups (same business key appearing in multiple rows)
 *   - Actionable cleanup recommendations
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

// ─── Helpers ────────────────────────────────────────────────────────────────

const hr = (char = '─', width = 72) => char.repeat(width);

const pad = (str, len) => String(str ?? '').padEnd(len);

const fmt = (n) => Number(n).toLocaleString();

/**
 * Mirrors getDuplicateKey() from import.controller.js exactly.
 * Any change to the controller's logic should be reflected here.
 */
const getDuplicateKey = (sourceType, record) => {
    if (sourceType === 'sales')
        return `sales::${record.order_id || ''}`;

    if (sourceType === 'google_analytics')
        return `ga::${record.date || ''}::${record.source || ''}::${record.medium || ''}::${record.campaign_name || ''}::${record.channel || ''}::${record.device || ''}`;

    if (sourceType === 'meta_ads' || sourceType === 'google_ads')
        return `ads::${record.platform || ''}::${record.platform_id || ''}::${record.date || ''}::${record.campaign_name || ''}::${record.adset || record.ad_group || ''}::${record.ad_name || ''}::${record.impressions ?? ''}::${record.clicks ?? ''}::${record.spend ?? ''}`;

    if (sourceType === 'funnel')
        return `funnel::${record.date || ''}::${record.channel || ''}::${record.device || ''}::${record.step_order || ''}::${record.step_name || ''}`;

    if (sourceType === 'campaigns')
        return `campaigns::${record.campaign_name || ''}::${record.platform || ''}`;

    if (sourceType === 'channel_mapping')
        return `channel_mapping::${record.source || ''}::${record.medium || ''}`;

    if (sourceType === 'customers')
        return `customers::${record.customer_id || ''}`;

    return null;
};

// ─── Table Definitions ───────────────────────────────────────────────────────

/**
 * Each entry describes one data table and how to derive its duplicate key.
 *
 * source_types: the import source_type values that write to this table.
 * table:        the physical MySQL table name.
 * keyFields:    columns fetched per row to reconstruct the duplicate key.
 *               Must be enough for getDuplicateKey() to produce a non-null result.
 */
const TABLE_DEFS = [
    {
        label: 'sales_data',
        table: 'sales_data',
        source_types: ['sales'],
        keyFields: ['id', 'import_id', 'order_id'],
    },
    {
        label: 'ads_data',
        table: 'ads_data',
        source_types: ['meta_ads', 'google_ads'],
        keyFields: ['id', 'import_id', 'platform', 'platform_id', 'date', 'campaign_name', 'adset', 'ad_group', 'ad_name', 'impressions', 'clicks', 'spend'],
    },
    {
        label: 'traffic_data',
        table: 'traffic_data',
        source_types: ['google_analytics'],
        keyFields: ['id', 'import_id', 'date', 'source', 'medium', 'campaign_name', 'channel', 'device'],
    },
    {
        label: 'campaign_data',
        table: 'campaign_data',
        source_types: ['campaigns'],
        keyFields: ['id', 'import_id', 'campaign_name', 'platform'],
    },
    {
        label: 'customer_data',
        table: 'customer_data',
        source_types: ['customers'],
        keyFields: ['id', 'import_id', 'customer_id'],
    },
    {
        label: 'funnel_data',
        table: 'funnel_data',
        source_types: ['funnel'],
        keyFields: ['id', 'import_id', 'date', 'channel', 'device', 'step_order', 'step_name'],
    },
];

// ─── Core Analysis Functions ─────────────────────────────────────────────────

/**
 * Fetches all import_logs rows ordered by creation time.
 */
const fetchImports = async () => {
    return sequelize.query(
        `SELECT
            id,
            file_name,
            source_type,
            status,
            row_count,
            error_count,
            created_at,
            completed_at
         FROM import_logs
         ORDER BY created_at ASC`,
        { type: QueryTypes.SELECT }
    );
};

/**
 * For a given table, returns the total row count and a breakdown by import_id.
 */
const fetchRowCounts = async (tableName) => {
    const [totalRow] = await sequelize.query(
        `SELECT COUNT(*) AS total FROM \`${tableName}\``,
        { type: QueryTypes.SELECT }
    );

    const byImport = await sequelize.query(
        `SELECT
            import_id,
            COUNT(*) AS row_count
         FROM \`${tableName}\`
         GROUP BY import_id
         ORDER BY import_id ASC`,
        { type: QueryTypes.SELECT }
    );

    return { total: Number(totalRow.total), byImport };
};

/**
 * Fetches all rows from a table (only the columns needed for key generation)
 * and groups them by their duplicate key. Returns only groups with > 1 row.
 *
 * For large tables this is done in streaming batches to avoid OOM.
 */
const findDuplicateGroups = async (def) => {
    const BATCH_SIZE = 5000;
    const keyMap = new Map(); // duplicateKey → [{ id, import_id }]

    let offset = 0;
    while (true) {
        const cols = def.keyFields.map((f) => `\`${f}\``).join(', ');
        const rows = await sequelize.query(
            `SELECT ${cols} FROM \`${def.table}\` ORDER BY id ASC LIMIT ${BATCH_SIZE} OFFSET ${offset}`,
            { type: QueryTypes.SELECT }
        );

        if (rows.length === 0) break;

        for (const row of rows) {
            // Try each source_type for this table until we get a non-null key.
            let key = null;
            for (const st of def.source_types) {
                key = getDuplicateKey(st, row);
                if (key) break;
            }
            if (!key) continue;

            const existing = keyMap.get(key) || [];
            existing.push({ id: row.id, import_id: row.import_id ?? null });
            keyMap.set(key, existing);
        }

        offset += rows.length;
        if (rows.length < BATCH_SIZE) break;
    }

    // Keep only keys that appear more than once
    const duplicates = [];
    for (const [key, entries] of keyMap.entries()) {
        if (entries.length > 1) {
            duplicates.push({ key, entries });
        }
    }

    return duplicates;
};

// ─── Report Rendering ────────────────────────────────────────────────────────

const renderImportsTable = (imports) => {
    console.log('\n' + hr('═'));
    console.log('  IMPORT LOG — All Uploads');
    console.log(hr('═'));

    if (imports.length === 0) {
        console.log('  No imports found in import_logs.\n');
        return;
    }

    const colW = [6, 14, 20, 12, 10, 8, 22];
    const header = [
        pad('ID',          colW[0]),
        pad('Source Type', colW[1]),
        pad('File Name',   colW[2]),
        pad('Status',      colW[3]),
        pad('Rows',        colW[4]),
        pad('Errors',      colW[5]),
        pad('Uploaded At', colW[6]),
    ].join('  ');

    console.log('  ' + header);
    console.log('  ' + hr('─'));

    for (const imp of imports) {
        const fileName = String(imp.file_name || '').slice(0, 19);
        const uploadedAt = imp.created_at
            ? new Date(imp.created_at).toISOString().replace('T', ' ').slice(0, 19)
            : '—';

        const row = [
            pad(imp.id,          colW[0]),
            pad(imp.source_type, colW[1]),
            pad(fileName,        colW[2]),
            pad(imp.status,      colW[3]),
            pad(fmt(imp.row_count), colW[4]),
            pad(imp.error_count, colW[5]),
            pad(uploadedAt,      colW[6]),
        ].join('  ');

        console.log('  ' + row);
    }
    console.log();
};

const renderTableAnalysis = (def, counts, duplicates, importMap) => {
    console.log(hr('─'));
    console.log(`  TABLE: ${def.label.toUpperCase()}`);
    console.log(hr('─'));
    console.log(`  Total rows : ${fmt(counts.total)}`);

    if (counts.byImport.length === 0) {
        console.log('  No rows found.\n');
        return { dupRowCount: 0, affectedImports: new Set() };
    }

    // Rows by import
    console.log('\n  Rows by import:');
    for (const row of counts.byImport) {
        const importId = row.import_id ?? 'NULL (no import_id)';
        const imp = importMap.get(Number(row.import_id));
        const label = imp
            ? `Import #${imp.id} — ${imp.source_type} — ${imp.file_name}`
            : `Import #${importId}`;
        console.log(`    ${pad(fmt(row.row_count), 8)}  rows  ←  ${label}`);
    }

    // Duplicate summary
    const dupRowCount = duplicates.reduce((sum, g) => sum + g.entries.length, 0);
    const affectedImports = new Set(
        duplicates.flatMap((g) => g.entries.map((e) => e.import_id))
    );

    console.log(`\n  Duplicate groups : ${fmt(duplicates.length)}`);
    console.log(`  Duplicate rows   : ${fmt(dupRowCount)}`);

    if (duplicates.length === 0) {
        console.log('  ✅ No duplicates detected.\n');
        return { dupRowCount: 0, affectedImports };
    }

    // Show up to 10 example groups
    const SHOW_LIMIT = 10;
    console.log(`\n  Sample duplicate groups (showing up to ${SHOW_LIMIT}):`);

    for (const group of duplicates.slice(0, SHOW_LIMIT)) {
        // Truncate long keys for readability
        const displayKey = group.key.length > 80
            ? group.key.slice(0, 77) + '...'
            : group.key;

        console.log(`\n    Key : ${displayKey}`);
        console.log(`    Occurrences (${group.entries.length}):`);

        for (const entry of group.entries) {
            const imp = importMap.get(Number(entry.import_id));
            const importLabel = imp
                ? `Import #${imp.id} (${imp.source_type}, ${imp.file_name})`
                : entry.import_id
                    ? `Import #${entry.import_id}`
                    : 'no import_id';
            console.log(`      row id=${entry.id}  ←  ${importLabel}`);
        }
    }

    if (duplicates.length > SHOW_LIMIT) {
        console.log(`\n    … and ${duplicates.length - SHOW_LIMIT} more duplicate groups not shown.`);
    }

    console.log();
    return { dupRowCount, affectedImports };
};

const renderRecommendations = (summary, imports) => {
    console.log('\n' + hr('═'));
    console.log('  RECOMMENDATIONS');
    console.log(hr('═'));

    const totalDupRows = Object.values(summary).reduce((s, t) => s + t.dupRowCount, 0);

    if (totalDupRows === 0) {
        console.log('\n  ✅ No duplicate records were found across any table.');
        console.log('     Your data appears to be clean.\n');
        return;
    }

    console.log(`\n  ⚠️  Found ${fmt(totalDupRows)} duplicate rows across all tables.\n`);

    // Collect all affected import IDs across every table
    const allAffectedImportIds = new Set(
        Object.values(summary).flatMap((t) => [...t.affectedImports])
    );

    if (allAffectedImportIds.size > 0) {
        console.log('  Imports involved in duplicates:');
        for (const importId of [...allAffectedImportIds].sort((a, b) => a - b)) {
            const imp = imports.find((i) => i.id === Number(importId));
            if (imp) {
                const uploadedAt = imp.created_at
                    ? new Date(imp.created_at).toISOString().replace('T', ' ').slice(0, 19)
                    : '—';
                console.log(`    • Import #${imp.id}  ${imp.source_type}  "${imp.file_name}"  uploaded ${uploadedAt}`);
            } else {
                console.log(`    • Import #${importId}  (details not found in import_logs)`);
            }
        }
    }

    console.log('\n  Suggested cleanup steps:');
    console.log('');
    console.log('  1. IDENTIFY the duplicate import(s) listed above.');
    console.log('     The later upload of the same file is typically the one to remove.');
    console.log('');
    console.log('  2. DELETE rows from the affected table(s) that belong to the');
    console.log('     unwanted import_id. Example:');
    console.log('');

    for (const [tableLabel, info] of Object.entries(summary)) {
        if (info.dupRowCount === 0) continue;
        const importIds = [...info.affectedImports]
            .filter(Boolean)
            .sort((a, b) => a - b);
        if (importIds.length > 0) {
            // Suggest deleting the highest import_id (most recent upload)
            const targetId = importIds[importIds.length - 1];
            console.log(`       DELETE FROM ${tableLabel} WHERE import_id = ${targetId};`);
        }
    }

    console.log('');
    console.log('  3. DELETE the corresponding import_log entry so the dashboard');
    console.log('     no longer counts it:');
    console.log('');

    for (const importId of [...allAffectedImportIds].sort((a, b) => b - a).slice(0, 3)) {
        console.log(`       DELETE FROM import_logs WHERE id = ${importId};`);
    }

    console.log('');
    console.log('  ⚠️  Always take a database backup before running DELETE statements.');
    console.log('     Run the DELETE in a transaction and verify row counts first.\n');
};

// ─── Main ────────────────────────────────────────────────────────────────────

const run = async () => {
    console.log('\n' + hr('═'));
    console.log('  KPI-DASHBOARD — Duplicate Detection Report');
    console.log('  Generated: ' + new Date().toISOString());
    console.log(hr('═'));

    await sequelize.authenticate();

    // 1. Fetch all imports
    const imports = await fetchImports();
    const importMap = new Map(imports.map((i) => [i.id, i]));

    renderImportsTable(imports);

    if (imports.length === 0) {
        console.log('  Nothing to analyse — no imports on record.\n');
        await sequelize.close();
        return;
    }

    // 2. Analyse each table
    console.log(hr('═'));
    console.log('  TABLE ANALYSIS');
    console.log(hr('═') + '\n');

    const summary = {};

    for (const def of TABLE_DEFS) {
        process.stdout.write(`  Scanning ${def.label} … `);

        let counts, duplicates;
        try {
            counts = await fetchRowCounts(def.table);
            duplicates = await findDuplicateGroups(def);
            console.log(`done  (${fmt(counts.total)} rows, ${fmt(duplicates.length)} dup groups)`);
        } catch (err) {
            console.log(`ERROR — ${err.message}`);
            summary[def.label] = { dupRowCount: 0, affectedImports: new Set() };
            continue;
        }

        const result = renderTableAnalysis(def, counts, duplicates, importMap);
        summary[def.label] = result;
    }

    // 3. Recommendations
    renderRecommendations(summary, imports);

    await sequelize.close();
};

run().catch((err) => {
    console.error('\n❌ Script failed:', err.message);
    if (err.parent) console.error('   SQL:', err.parent.sqlMessage || err.parent.message);
    process.exit(1);
});
