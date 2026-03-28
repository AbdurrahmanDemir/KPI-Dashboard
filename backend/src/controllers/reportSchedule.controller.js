const ReportSchedule = require('../models/ReportSchedule');
const AuditLog = require('../models/AuditLog');
const { successResponse, errorResponse } = require('../utils/response');
const { sendEmailReport, getDeliveryMode } = require('../services/notification.service');
const { getNextRunAt } = require('../services/reportScheduler.service');

const ALLOWED_FREQUENCIES = ['daily', 'weekly', 'monthly'];

const parseRecipients = (value) => {
    const rawValues = Array.isArray(value) ? value : String(value || '').split(',');
    const recipients = rawValues
        .map((item) => String(item || '').trim().toLowerCase())
        .filter(Boolean);

    return [...new Set(recipients)];
};

const validatePayload = ({ name, frequency, recipients }) => {
    if (!String(name || '').trim()) {
        return 'Plan adi zorunludur.';
    }

    if (!ALLOWED_FREQUENCIES.includes(frequency)) {
        return 'Gecersiz rapor sikligi secildi.';
    }

    const parsedRecipients = parseRecipients(recipients);
    if (!parsedRecipients.length) {
        return 'En az bir alici e-posta adresi zorunludur.';
    }

    const invalidRecipient = parsedRecipients.find((email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
    if (invalidRecipient) {
        return `Gecersiz e-posta adresi: ${invalidRecipient}`;
    }

    return null;
};

const writeAuditLog = async (req, action, entityId, payload = {}) => {
    try {
        await AuditLog.create({
            user_id: req.user?.id || null,
            action,
            entity_type: 'report_schedule',
            entity_id: String(entityId),
            ip_address: req.ip || req.connection?.remoteAddress,
            user_agent: req.get('User-Agent')?.substring(0, 500),
            payload,
        });
    } catch (_) {
        // Audit log failures should not block the main flow.
    }
};

const buildScheduleResponse = (schedule) => ({
    id: schedule.id,
    user_id: schedule.user_id,
    name: schedule.name,
    frequency: schedule.frequency,
    recipients: Array.isArray(schedule.recipients) ? schedule.recipients : [],
    filter_config: schedule.filter_config || {},
    is_active: schedule.is_active,
    last_sent_at: schedule.last_sent_at,
    last_run_at: schedule.last_run_at,
    last_error: schedule.last_error,
    next_run_at: getNextRunAt(schedule),
    delivery_mode: getDeliveryMode(),
    created_at: schedule.created_at,
    updated_at: schedule.updated_at,
});

const getScheduleByIdForUser = async (req, id) => {
    const where = { id };
    if (req.user.role !== 'admin') {
        where.user_id = req.user.id;
    }

    return ReportSchedule.findOne({ where });
};

const listSchedules = async (req, res) => {
    try {
        const where = req.user.role === 'admin' ? {} : { user_id: req.user.id };
        const schedules = await ReportSchedule.findAll({
            where,
            order: [['created_at', 'DESC']],
        });

        return successResponse(res, schedules.map(buildScheduleResponse));
    } catch (err) {
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'Rapor planlari getirilemedi.');
    }
};

const createSchedule = async (req, res) => {
    try {
        const payloadError = validatePayload(req.body);
        if (payloadError) {
            return errorResponse(res, 400, 'VALIDATION_ERROR', payloadError);
        }

        const schedule = await ReportSchedule.create({
            user_id: req.user.id,
            name: String(req.body.name).trim(),
            frequency: req.body.frequency,
            recipients: parseRecipients(req.body.recipients),
            filter_config: req.body.filter_config || {},
            is_active: typeof req.body.is_active === 'boolean' ? req.body.is_active : true,
        });

        await writeAuditLog(req, 'report_schedule_created', schedule.id, buildScheduleResponse(schedule));
        return successResponse(res, buildScheduleResponse(schedule), 201);
    } catch (err) {
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'Rapor plani olusturulamadi.');
    }
};

const updateSchedule = async (req, res) => {
    try {
        const schedule = await getScheduleByIdForUser(req, req.params.id);
        if (!schedule) {
            return errorResponse(res, 404, 'NOT_FOUND', 'Rapor plani bulunamadi.');
        }

        const mergedPayload = {
            name: req.body.name ?? schedule.name,
            frequency: req.body.frequency ?? schedule.frequency,
            recipients: req.body.recipients ?? schedule.recipients,
        };

        const payloadError = validatePayload(mergedPayload);
        if (payloadError) {
            return errorResponse(res, 400, 'VALIDATION_ERROR', payloadError);
        }

        schedule.name = String(mergedPayload.name).trim();
        schedule.frequency = mergedPayload.frequency;
        schedule.recipients = parseRecipients(mergedPayload.recipients);
        schedule.filter_config = req.body.filter_config ?? schedule.filter_config ?? {};
        if (typeof req.body.is_active === 'boolean') {
            schedule.is_active = req.body.is_active;
        }

        await schedule.save();
        await writeAuditLog(req, 'report_schedule_updated', schedule.id, buildScheduleResponse(schedule));
        return successResponse(res, buildScheduleResponse(schedule));
    } catch (err) {
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'Rapor plani guncellenemedi.');
    }
};

const deleteSchedule = async (req, res) => {
    try {
        const schedule = await getScheduleByIdForUser(req, req.params.id);
        if (!schedule) {
            return errorResponse(res, 404, 'NOT_FOUND', 'Rapor plani bulunamadi.');
        }

        await schedule.destroy();
        await writeAuditLog(req, 'report_schedule_deleted', req.params.id, { id: Number(req.params.id) });
        return successResponse(res, { id: Number(req.params.id), message: 'Rapor plani silindi.' });
    } catch (err) {
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'Rapor plani silinemedi.');
    }
};

const sendTestReport = async (req, res) => {
    try {
        const schedule = await getScheduleByIdForUser(req, req.params.id);
        if (!schedule) {
            return errorResponse(res, 404, 'NOT_FOUND', 'Rapor plani bulunamadi.');
        }

        const recipients = Array.isArray(schedule.recipients) ? schedule.recipients : [];
        const sent = await sendEmailReport(
            recipients.join(', '),
            `[TEST] ${schedule.name}`,
            `
                <h2>KPI Dashboard Test Raporu</h2>
                <p>Bu gonderim otomatik raporlama akisinin test mesajidir.</p>
                <p>Frekans: ${schedule.frequency}</p>
                <p>Alicilar: ${recipients.join(', ')}</p>
            `
        );

        if (!sent) {
            return errorResponse(res, 500, 'DELIVERY_FAILED', 'Test raporu gonderilemedi.');
        }

        schedule.last_sent_at = new Date();
        schedule.last_run_at = new Date();
        schedule.last_error = null;
        await schedule.save();
        await writeAuditLog(req, 'report_schedule_test_sent', schedule.id, {
            recipients,
            frequency: schedule.frequency,
        });

        return successResponse(res, {
            id: schedule.id,
            message: 'Test raporu gonderildi.',
            last_sent_at: schedule.last_sent_at,
            last_run_at: schedule.last_run_at,
            delivery_mode: getDeliveryMode(),
        });
    } catch (err) {
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'Test raporu gonderilemedi.');
    }
};

module.exports = {
    listSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    sendTestReport,
};
