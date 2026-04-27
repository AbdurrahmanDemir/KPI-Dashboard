const { sequelize } = require('./src/config/database');

(async () => {
    try {
        await sequelize.query("ALTER TABLE ads_data MODIFY COLUMN ctr DECIMAL(10,4) NOT NULL DEFAULT 0.0000");
        console.log('✅ ctr column updated to DECIMAL(10,4)');

        await sequelize.query("ALTER TABLE ads_data ALTER COLUMN campaign_name SET DEFAULT ''");
        console.log('✅ campaign_name default set');

        console.log('Schema fix complete.');
        process.exit(0);
    } catch (e) {
        console.error('Error:', e.message);
        process.exit(1);
    }
})();
