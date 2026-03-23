/**
 * Notification Service
 * Amaç: Haftalık KPI raporlarını E-Posta veya Slack üzerinden belirlenen kişilere otomatik göndermek.
 * E-Posta için Nodemailer entegrasyonu veya AWS SES kullanılabilir.
 */

// Örn: const nodemailer = require('nodemailer');

const sendEmailReport = async (to, subject, htmlContent, attachments = []) => {
    try {
        console.log(`[MAIL GÖNDERİLİYOR] Alıcı: ${to} | Konu: ${subject}`);
        /*
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
        await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to,
            subject,
            html: htmlContent,
            attachments
        });
        */
        console.log('[MAIL] Başarıyla gönderildi (Mock)');
        return true;
    } catch (err) {
        console.error('[MAIL Hatası]', err);
        return false;
    }
};

const sendSlackNotification = async (webhookUrl, messageBlocks) => {
    try {
        console.log(`[SLACK GÖNDERİLİYOR] ${webhookUrl}`);
        /*
        await axios.post(webhookUrl, {
            text: "Yeni KPI Raporu",
            blocks: messageBlocks
        });
        */
        console.log('[SLACK] Başarıyla gönderildi (Mock)');
        return true;
    } catch (err) {
        console.error('[SLACK Hatası]', err);
        return false;
    }
};

module.exports = {
    sendEmailReport,
    sendSlackNotification
};
