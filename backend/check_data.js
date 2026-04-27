const { sequelize } = require('./src/config/database');

(async () => {
    try {
        const [results] = await sequelize.query("SELECT platform, COUNT(*) as count, MIN(date) as min_date, MAX(date) as max_date FROM ads_data GROUP BY platform");
        console.log('--- Ads Data Summary ---');
        console.table(results);
        
        const [imports] = await sequelize.query("SELECT id, source_type, status, row_count, created_at FROM import_logs ORDER BY created_at DESC LIMIT 10");
        console.log('--- Recent Imports ---');
        console.table(imports);

        const [logs] = await sequelize.query("SELECT action, entity_type, entity_id, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 20");
        console.log('--- Recent Audit Logs ---');
        console.table(logs);
        
        process.exit(0);
    } catch (e) {
        console.error('Error:', e.message);
        process.exit(1);
    }
})();
