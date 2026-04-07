const fs = require('fs');
const path = require('path');

async function testUpload(sourceType, filename) {
    console.log(`\n--- Testing ${sourceType} ---`);
    const filePath = path.join(__dirname, '../docs/dummy-data', filename);
    if (!fs.existsSync(filePath)) {
        console.log(`File not found: ${filePath}`);
        return;
    }

    try {
        // We will directly use the service logic since reaching API without valid session/token requires auth bypass.
        // It's much easier to bypass the auth checking or directly invoke the controller methods by mocking req/res!
        const importController = require('./src/controllers/import.controller');
        
        let resJson = null;
        let resStatus = 200;
        const res = {
            status: (s) => { resStatus = s; return res; },
            json: (j) => { resJson = j; return res; }
        };

        const req = {
            user: { id: 1, role: 'admin' },
            body: { source_type: sourceType },
            file: { originalname: filename, filename: filename, path: filePath, mimetype: 'text/csv' },
            ip: '127.0.0.1',
            get: () => 'TestAgent'
        };

        // 1. UPLOAD
        // For upload, controller expects file to be in `req.file.filename`. 
        // Then it reads from `uploads/filename`. So we need to copy dummy to uploads/ first.
        const uploadPath = path.join(__dirname, 'uploads', filename);
        if (!fs.existsSync(path.join(__dirname, 'uploads'))) fs.mkdirSync(path.join(__dirname, 'uploads'));
        fs.copyFileSync(filePath, uploadPath);

        await importController.uploadFile(req, res);
        console.log("Upload Response:", resStatus, resJson);
        const importId = resJson?.data?.id;
        
        if (!importId) return;

        // 2. PREVIEW
        req.params = { id: importId };
        await importController.getPreview(req, res);
        console.log("Preview Response:", resStatus, resJson ? "OK (Mappings Suggestion Received)" : "FAIL");
        const suggested = resJson?.data?.suggested_mapping;

        // 3. MAP
        req.body = { mapping: suggested };
        await importController.mapColumns(req, res);
        console.log("Map Response:", resStatus, resJson);

        // 4. VALIDATE
        await importController.validateImport(req, res);
        console.log("Validate Response:", resStatus, resJson);

        if (resJson?.data?.valid) {
            // 5. COMMIT
            await importController.commitImport(req, res);
            console.log("Commit Response:", resStatus, resJson);
        } else {
            console.log("Skipping commit because validation failed.");
        }

    } catch (e) {
        console.error("Test Error:", e);
    }
}

async function run() {
    require('dotenv').config();
    const { sequelize } = require('./src/config/database');
    await sequelize.authenticate();

    await testUpload('sales', 'sales_data.csv');
    await testUpload('google_analytics', 'google_analytics.csv');
    process.exit(0);
}
run();
