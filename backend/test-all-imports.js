const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const API_BASE = 'http://localhost:5000/api';

const uploadAndCommit = async (filePath, sourceType) => {
    console.log(`Processing ${sourceType} from ${filePath}`);
    try {
        const form = new FormData();
        form.append('file', fs.createReadStream(filePath));
        form.append('source_type', sourceType);

        const uploadRes = await axios.post(`${API_BASE}/imports`, form, {
            headers: form.getHeaders(),
        });
        const importId = uploadRes.data.data.id;
        console.log(`Uploaded! ID: ${importId}`);

        console.log('Mapping...');
        await axios.post(`${API_BASE}/imports/${importId}/map-columns`, {
            mapping: uploadRes.data.data.suggested_mapping || {}
        });

        console.log('Validating...');
        const validRes = await axios.post(`${API_BASE}/imports/${importId}/validate`);
        console.log(`Validation completed.`);

        if (validRes.data.data.valid) {
            console.log('Committing...');
            await axios.post(`${API_BASE}/imports/${importId}/commit`);
            console.log('Committed successfully!\n');
        } else {
            console.log('Skipping commit due to validation errors.\n');
            console.log(validRes.data.data.errors.slice(0, 3));
        }

    } catch (e) {
        console.error(`Error processing ${sourceType}:`, e.response?.data || e.message);
    }
};

const run = async () => {
    await uploadAndCommit(path.join(__dirname, '../docs/dummy-data/orders.csv'), 'sales');
    await uploadAndCommit(path.join(__dirname, '../docs/dummy-data/ga4_traffic.csv'), 'google_analytics');
    await uploadAndCommit(path.join(__dirname, '../docs/dummy-data/meta_ads.csv'), 'meta_ads');
    await uploadAndCommit(path.join(__dirname, '../docs/dummy-data/google_ads.csv'), 'google_ads');
};

run();
