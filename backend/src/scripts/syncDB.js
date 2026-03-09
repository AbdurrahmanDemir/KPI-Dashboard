/**
 * Veritabanı Senkronizasyon Scripti
 * Tüm Sequelize modelleri MySQL'e senkronize eder (tabloları oluşturur)
 *
 * Çalıştırma: npm run db:sync
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const { sequelize } = require('../config/database');

// Tüm modelleri yükle (ilişkiler dahil)
require('../models/index');

const syncDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Veritabanı bağlantısı başarılı.\n');

        // force: false → mevcut tabloları silmez, sadece eksikleri ekler
        // alter: true  → mevcut tablolara yeni kolonlar ekler
        await sequelize.sync({ force: false, alter: false });

        console.log('✅ Tüm tablolar başarıyla oluşturuldu:\n');

        const [tables] = await sequelize.query('SHOW TABLES');
        tables.forEach((t) => {
            const tableName = Object.values(t)[0];
            console.log(`   📋 ${tableName}`);
        });

        console.log('\n🎉 Veritabanı hazır!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Senkronizasyon hatası:', error.message);
        if (error.parent) {
            console.error('   SQL Hatası:', error.parent.sqlMessage || error.parent.message);
        }
        process.exit(1);
    }
};

syncDB();
