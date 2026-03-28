/**
 * Notification Service
 * Mock e-posta ve Slack bildirim servisi.
 * SMTP bilgileri tanimli olsa bile bu surumde teslimat simule edilir.
 */

const getDeliveryMode = () => {
    const hasSmtpConfig = Boolean(
        process.env.SMTP_HOST &&
        process.env.SMTP_PORT &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASS &&
        process.env.SMTP_FROM
    );

    return hasSmtpConfig ? 'smtp_configured_mock' : 'mock';
};

const sendEmailReport = async (to, subject, htmlContent, attachments = []) => {
    try {
        console.log(`[MAIL GONDERILIYOR] Alici: ${to} | Konu: ${subject} | Mod: ${getDeliveryMode()}`);
        void htmlContent;
        void attachments;
        console.log('[MAIL] Basariyla gonderildi (Mock)');
        return true;
    } catch (err) {
        console.error('[MAIL Hatasi]', err);
        return false;
    }
};

const sendSlackNotification = async (webhookUrl, messageBlocks) => {
    try {
        console.log(`[SLACK GONDERILIYOR] ${webhookUrl}`);
        void messageBlocks;
        console.log('[SLACK] Basariyla gonderildi (Mock)');
        return true;
    } catch (err) {
        console.error('[SLACK Hatasi]', err);
        return false;
    }
};

module.exports = {
    sendEmailReport,
    sendSlackNotification,
    getDeliveryMode,
};
