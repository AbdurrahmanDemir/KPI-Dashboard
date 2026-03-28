const ReportSchedule = require('../models/ReportSchedule');
const AuditLog = require('../models/AuditLog');
const { getTrafficKPIs, getAdsKPIs, getSalesKPIs } = require('./kpi.service');
const { sendEmailReport } = require('./notification.service');

let schedulerHandle = null;
let schedulerRunning = false;

const addFrequency = (date, frequency) => {
    const next = new Date(date);

    if (frequency === 'daily') {
        next.setDate(next.getDate() + 1);
        return next;
    }

    if (frequency === 'weekly') {
        next.setDate(next.getDate() + 7);
        return next;
    }

    next.setMonth(next.getMonth() + 1);
    return next;
};

const getNextRunAt = (schedule) => {
    const baseDate = schedule.last_sent_at || schedule.created_at || new Date();
    return addFrequency(baseDate, schedule.frequency);
};

const isDue = (schedule, now = new Date()) => {
    if (!schedule.is_active) return false;
    return getNextRunAt(schedule) <= now;
};

const buildSummaryHtml = async (schedule) => {
    const filters = schedule.filter_config || {};
    const [traffic, ads, sales] = await Promise.all([
        getTrafficKPIs(filters),
        getAdsKPIs(filters),
        getSalesKPIs(filters),
    ]);

    return `
        <h2>KPI Dashboard Otomatik Raporu</h2>
        <p>Plan: ${schedule.name}</p>
        <p>Frekans: ${schedule.frequency}</p>
        <h3>Satis</h3>
        <ul>
            <li>Toplam ciro: ${sales.revenue}</li>
            <li>Siparis: ${sales.orders}</li>
            <li>AOV: ${sales.aov}</li>
        </ul>
        <h3>Reklam</h3>
        <ul>
            <li>Harcama: ${ads.spend}</li>
            <li>ROAS: ${ads.roas}</li>
            <li>Tiklama: ${ads.clicks}</li>
        </ul>
        <h3>Trafik</h3>
        <ul>
            <li>Sessions: ${traffic.sessions}</li>
            <li>Users: ${traffic.users}</li>
            <li>CVR: ${traffic.cvr}</li>
        </ul>
        <p>Bu e-posta KPI Dashboard scheduler servisi tarafindan olusturuldu.</p>
    `;
};

const writeAuditLog = async (schedule, action, payload = {}) => {
    try {
        await AuditLog.create({
            user_id: schedule.user_id,
            action,
            entity_type: 'report_schedule',
            entity_id: String(schedule.id),
            payload,
        });
    } catch (_) {
        // Audit log failures should not stop the scheduler.
    }
};

const runSchedule = async (schedule) => {
    const recipients = Array.isArray(schedule.recipients) ? schedule.recipients : [];

    try {
        const html = await buildSummaryHtml(schedule);
        const sent = await sendEmailReport(recipients.join(', '), `[AUTO] ${schedule.name}`, html);

        schedule.last_run_at = new Date();

        if (!sent) {
            schedule.last_error = 'Mail servisi raporu teslim edemedi.';
            await schedule.save();
            await writeAuditLog(schedule, 'report_schedule_failed', {
                recipients,
                message: schedule.last_error,
            });
            return false;
        }

        schedule.last_sent_at = new Date();
        schedule.last_error = null;
        await schedule.save();
        await writeAuditLog(schedule, 'report_schedule_sent', {
            recipients,
            frequency: schedule.frequency,
        });
        return true;
    } catch (err) {
        schedule.last_run_at = new Date();
        schedule.last_error = err.message;
        await schedule.save();
        await writeAuditLog(schedule, 'report_schedule_failed', {
            recipients,
            message: err.message,
        });
        return false;
    }
};

const runDueSchedules = async () => {
    if (schedulerRunning) return;
    schedulerRunning = true;

    try {
        const schedules = await ReportSchedule.findAll({
            where: { is_active: true },
            order: [['created_at', 'ASC']],
        });

        const now = new Date();
        for (const schedule of schedules) {
            if (isDue(schedule, now)) {
                await runSchedule(schedule);
            }
        }
    } finally {
        schedulerRunning = false;
    }
};

const startReportScheduler = () => {
    if (schedulerHandle) return schedulerHandle;

    const intervalMs = parseInt(process.env.REPORT_SCHEDULER_INTERVAL_MS || '60000', 10);
    schedulerHandle = setInterval(() => {
        runDueSchedules().catch((err) => {
            console.error('[REPORT SCHEDULER] Poll error:', err.message);
        });
    }, intervalMs);

    schedulerHandle.unref?.();
    runDueSchedules().catch((err) => {
        console.error('[REPORT SCHEDULER] Initial run error:', err.message);
    });

    return schedulerHandle;
};

module.exports = {
    getNextRunAt,
    runSchedule,
    runDueSchedules,
    startReportScheduler,
};
