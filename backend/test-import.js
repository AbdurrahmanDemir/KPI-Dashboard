const path = require('path');
const fs = require('fs');
const { getSourceFields, suggestMapping, getRequiredFields } = require('./src/services/importMapping.service');

// import.controller'ın içinden validate ve parse metotlarına benzer logic
// sales_data.csv üzerinde 
const csv = require('csv-parser');

async function testImport() {
    const filePath = path.join(__dirname, '../docs/dummy-data/sales_data.csv');
    if (!fs.existsSync(filePath)) {
        console.log("No sales_data.csv found!");
        return;
    }

    const rows = [];
    await new Promise((resolve) => {
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (d) => rows.push(d))
            .on('end', resolve);
    });

    console.log(`Parsed ${rows.length} rows.`);
    const headers = Object.keys(rows[0] || {});
    console.log("Headers:", headers);
    
    // Simulate Suggest Mapping
    const mapping = suggestMapping('sales', headers);
    console.log("Mapping:", mapping);
    
    // Simulate req fields
    const reqFields = getRequiredFields('sales');
    const mappedTargets = new Set(Object.values(mapping));
    const missing = reqFields.filter(f => !mappedTargets.has(f));
    console.log(`Missing Required Fields:`, missing);
}

testImport().catch(console.error);
