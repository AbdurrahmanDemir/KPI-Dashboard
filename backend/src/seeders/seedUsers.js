/**
 * Seed: users tablosuna admin + viewer hesapları ekle
 * Çalıştırma: node src/seeders/seedUsers.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const { sequelize } = require('../config/database');
require('../models/index');
const User = require('../models/User');

const users = [
    {
        name: 'Admin Kullanıcı',
        email: 'admin@kpidashboard.com',
        password_hash: 'admin123',
        role: 'admin',
        is_active: true,
    },
    {
        name: 'Viewer Kullanıcı',
        email: 'viewer@kpidashboard.com',
        password_hash: 'viewer123',
        role: 'viewer',
        is_active: true,
    },
    {
        name: 'Emre Yavşan',
        email: 'emre.yavsan@sporthink.com.tr',
        password_hash: 'sporthink2024',
        role: 'admin',
        is_active: true,
    },
    {
        name: 'Mert Gülseren',
        email: 'mert.gulseren@sporthink.com.tr',
        password_hash: 'sporthink2024',
        role: 'admin',
        is_active: true,
    },
];

(async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ DB bağlantısı OK\n');

        for (const u of users) {
            const [user, created] = await User.findOrCreate({
                where: { email: u.email },
                defaults: u,
            });

            if (created) {
                console.log(`   ✅ Oluşturuldu: ${user.name} (${user.role}) — ${user.email}`);
            } else {
                console.log(`   ⏭️  Zaten var:   ${user.name} (${user.role}) — ${user.email}`);
            }
        }

        console.log('\n🎉 Seed tamamlandı!\n');
        console.log('📝 Giriş bilgileri:');
        console.log('   Admin:  admin@kpidashboard.com / admin123');
        console.log('   Viewer: viewer@kpidashboard.com / viewer123');
        process.exit(0);
    } catch (err) {
        console.error('❌ Hata:', err.message);
        process.exit(1);
    }
})();
