require('dotenv').config();
process.env.NODE_ENV = 'production';
const { sequelize } = require('./src/config/database');
const SalesData = require('./src/models/SalesData');
const AdsData = require('./src/models/AdsData');
const TrafficData = require('./src/models/TrafficData');

async function test() {
    try {
        await sequelize.authenticate();
        const salesCount = await SalesData.count();
        const adsCount = await AdsData.count();
        const trafficCount = await TrafficData.count();
        
        console.log(JSON.stringify({
            sales: salesCount,
            ads: adsCount,
            traffic: trafficCount
        }, null, 2));
    } catch(e) {
        console.error("ERROR:", e);
    } finally {
        process.exit(0);
    }
}

test();
