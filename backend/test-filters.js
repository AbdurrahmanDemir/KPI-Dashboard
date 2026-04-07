require('dotenv').config();
process.env.NODE_ENV = 'production';
const { sequelize } = require('./src/config/database');
const { getFilterOptions } = require('./src/services/dashboard.service');

async function test() {
    try {
        await sequelize.authenticate();
        console.log("DB connected");
        const options = await getFilterOptions();
        console.log("Options Campaigns:", options.campaigns.slice(0, 5)); // Just the first few
    } catch(e) {
        console.error("ERROR IN getFilterOptions:", e);
    } finally {
        process.exit(0);
    }
}
test();
