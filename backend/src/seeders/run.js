/**
 * Seed Runner — tüm seed'leri sırayla çalıştırır
 * Çalıştırma: npm run seed
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const { sequelize } = require('../config/database');
require('../models/index');
const User = require('../models/User');

// ─── Seed verileri ────────────────────────────────────────────────────────────
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

// ─── Runner ───────────────────────────────────────────────────────────────────
(async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ DB bağlantısı OK\n');

        // Tabloları oluştur/güncelle (mevcut veriyi silmeden)
        await sequelize.sync({ force: false, alter: false });
        console.log('✅ Tablolar hazır\n');

        // ── Users ──────────────────────────────────────────────────────────────
        console.log('👤 Kullanıcılar ekleniyor...');
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
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📝 Giriş Bilgileri:');
        console.log('   Admin:  admin@kpidashboard.com  / admin123');
        console.log('   Viewer: viewer@kpidashboard.com / viewer123');
        console.log('   Emre:   emre.yavsan@sporthink.com.tr / sporthink2024');
        console.log('   Mert:   mert.gulseren@sporthink.com.tr / sporthink2024');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seed hatası:', err.message);
        if (err.parent) {
            console.error('   SQL:', err.parent.sqlMessage || err.parent.message);
        }
        process.exit(1);
    }
})();
