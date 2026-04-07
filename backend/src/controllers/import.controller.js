const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const xlsx = require('xlsx');
const { Op } = require('sequelize');
const ImportLog = require('../models/ImportLog');
const SalesData = require('../models/SalesData');
const AdsData = require('../models/AdsData');
const TrafficData = require('../models/TrafficData');
const FunnelData = require('../models/FunnelData');
const KpiCache = require('../models/KpiCache');
const AuditLog = require('../models/AuditLog');
const { getSourceFields, getRequiredFields, suggestMapping } = require('../services/importMapping.service');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

const getFileType = (filename) => {
    const ext = path.extname(filename).toLowerCase();
    if (ext === '.csv') return 'csv';
    if (ext === '.json') return 'json';
    if (ext === '.xlsx' || ext === '.xls') return 'xlsx';
    return null;
};

const resolveTargetModel = (sourceType) => {
    if (sourceType === 'sales') return SalesData;
    if (sourceType === 'google_analytics') return TrafficData;
    if (sourceType === 'meta_ads' || sourceType === 'google_ads') return AdsData;
    if (sourceType === 'funnel') return FunnelData;
    return null;
};

const IMPORT_MODELS = [SalesData, AdsData, TrafficData, FunnelData];

const toNumber = (value) => {
    if (value === null || value === undefined || value === '') return null;
    const normalized = String(value).replace(/,/g, '.');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
};

const toInteger = (value) => {
    const parsed = toNumber(value);
    return parsed === null ? null : Math.round(parsed);
};

const toDateOnly = (value) => {
    if (!value) return null;

    const raw = String(value).trim();
    if (/^\d{8}$/.test(raw)) {
        return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
    }

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
        const [day, month, year] = raw.split('/');
        return `${year}-${month}-${day}`;
    }

    const isoCandidate = raw.replace(' ', 'T');
    const date = new Date(isoCandidate);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString().slice(0, 10);
};

const normalizeSalesStatus = (value) => {
    const normalized = String(value || '').trim().toLowerCase();

    if (['completed', 'complete', 'paid', 'shipped', 'delivered'].includes(normalized)) return 'completed';
    if (['cancelled', 'canceled', 'failed'].includes(normalized)) return 'cancelled';
    if (['refunded', 'refund', 'returned', 'iade'].includes(normalized)) return 'refunded';

    return 'completed';
};

const normalizeTrafficPercentage = (value) => {
    const parsed = toNumber(value);
    if (parsed === null) return null;
    return parsed <= 1 ? Number((parsed * 100).toFixed(2)) : parsed;
};

const normalizeImportedRecord = (record, sourceType, row) => {
    const normalized = { ...record };

    if (sourceType === 'sales') {
        normalized.order_date = toDateOnly(normalized.order_date);
        normalized.product_count = toInteger(normalized.product_count) ?? 1;
        normalized.order_revenue = toNumber(normalized.order_revenue) ?? 0;
        normalized.discount_amount = toNumber(normalized.discount_amount) ?? 0;
        normalized.refund_amount = toNumber(normalized.refund_amount) ?? 0;
        normalized.order_status = normalizeSalesStatus(normalized.order_status);
        normalized.attribution_source = normalized.attribution_source || 'analytics';
    }

    if (sourceType === 'google_analytics') {
        normalized.date = toDateOnly(normalized.date);
        normalized.sessions = toInteger(normalized.sessions) ?? 0;
        normalized.users = toInteger(normalized.users) ?? 0;
        normalized.new_users = toInteger(normalized.new_users) ?? 0;
        normalized.bounce_rate = normalizeTrafficPercentage(normalized.bounce_rate) ?? 0;
        normalized.avg_session_duration = toNumber(normalized.avg_session_duration) ?? 0;
        normalized.pages_per_session = toNumber(normalized.pages_per_session) ?? 0;
        normalized.pages_viewed = toInteger(normalized.pages_viewed) ?? 0;
        normalized.conversions = toInteger(normalized.conversions) ?? 0;
        normalized.revenue = toNumber(normalized.revenue) ?? 0;
        normalized.channel_group = normalized.channel_group || row.sessionDefaultChannelGroup || null;
        normalized.source = normalized.source || row.sessionSource || null;
        normalized.medium = normalized.medium || row.sessionMedium || null;
        normalized.campaign_name = normalized.campaign_name || row.sessionCampaignName || null;
        normalized.device = normalized.device || row.deviceCategory || null;
        normalized.city = normalized.city || row.city || null;
    }

    if (sourceType === 'meta_ads' || sourceType === 'google_ads') {
        normalized.date = toDateOnly(normalized.date);
        normalized.impressions = toInteger(normalized.impressions) ?? 0;
        normalized.clicks = toInteger(normalized.clicks) ?? 0;
        normalized.reach = toInteger(normalized.reach) ?? normalized.impressions ?? 0;
        normalized.conversions = toInteger(normalized.conversions) ?? 0;
        normalized.conversion_value = toNumber(normalized.conversion_value) ?? 0;
        
        const originalCurrency = String(normalized.currency || 'TRY').toUpperCase().trim();

        if (sourceType === 'google_ads') {
            normalized.spend = (toNumber(normalized.spend) ?? 0) / 1000000;
            normalized.cpc = (toNumber(normalized.cpc) ?? 0) / 1000000;
            normalized.ctr = normalizeTrafficPercentage(normalized.ctr) ?? 0;
        } else {
            normalized.spend = toNumber(normalized.spend) ?? 0;
            normalized.cpc = toNumber(normalized.cpc) ?? 0;
            normalized.ctr = toNumber(normalized.ctr) ?? 0;
        }

        // --- Currency Normalization ---
        let exchangeRate = 1;
        if (originalCurrency === 'USD') exchangeRate = 32.5;
        if (originalCurrency === 'EUR') exchangeRate = 35.2;
        if (originalCurrency === 'GBP') exchangeRate = 41.5;

        if (exchangeRate !== 1) {
            normalized.spend = normalized.spend * exchangeRate;
            normalized.conversion_value = normalized.conversion_value * exchangeRate;
            normalized.cpc = normalized.cpc * exchangeRate;
        }
        normalized.currency = 'TRY'; // Her durumda ana paramiz TRY kabul edilecek
    }

    if (sourceType === 'funnel') {
        normalized.date = toDateOnly(normalized.date);
        normalized.step_order = toInteger(normalized.step_order) ?? 0;
        normalized.session_count = toInteger(normalized.session_count) ?? 0;
    }

    return normalized;
};

const applySourceDefaults = (record, sourceType, row) => {
    if (sourceType === 'meta_ads') record.platform = 'meta';
    if (sourceType === 'google_ads') record.platform = 'google_ads';

    if (sourceType === 'google_analytics') {
        if (!record.channel) {
            record.channel = row.channel || row.channel_group || row.source || row.medium || 'unknown';
        }

        if (record.avg_session_duration === undefined && row.avg_duration !== undefined) {
            record.avg_session_duration = row.avg_duration;
        }
    }

    return record;
};

const parseImportFile = async (importLog) => {
    const filePath = path.join(__dirname, '../../uploads', importLog.file_name);

    if (!fs.existsSync(filePath)) {
        throw new Error('FILE_NOT_FOUND');
    }

    if (importLog.file_type === 'csv') {
        const rows = [];
        await new Promise((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (data) => rows.push(data))
                .on('end', resolve)
                .on('error', reject);
        });
        return rows;
    }

    if (importLog.file_type === 'xlsx') {
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        return xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: null });
    }

    if (importLog.file_type === 'json') {
        const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        return Array.isArray(json) ? json : [json];
    }

    return [];
};

const buildNormalizedRecords = (rows, importLog) => {
    const mapping = Object.keys(importLog.mapping_config || {}).length > 0
        ? importLog.mapping_config
        : suggestMapping(importLog.source_type, Object.keys(rows[0] || {}));

    return rows.map((row, index) => {
        const newRecord = {
            import_id: importLog.id,
            raw_payload: row
        };

        if (Object.keys(mapping).length > 0) {
            for (const [fileColumn, dbField] of Object.entries(mapping)) {
                if (dbField && row[fileColumn] !== undefined) {
                    newRecord[dbField] = row[fileColumn];
                }
            }
        } else {
            for (const key in row) {
                newRecord[key] = row[key];
            }
        }

        const withDefaults = applySourceDefaults(newRecord, importLog.source_type, row);
        return {
            row_number: index + 1,
            raw: row,
            normalized: normalizeImportedRecord(withDefaults, importLog.source_type, row)
        };
    });
};

const getDuplicateKey = (sourceType, record) => {
    if (sourceType === 'sales') return `sales::${record.order_id || ''}`;
    if (sourceType === 'google_analytics')
        // GA: tarih + kaynak + medium + kampanya + kanal + cihaz kombinasyonu
        return `ga::${record.date || ''}::${record.source || ''}::${record.medium || ''}::${record.campaign_name || ''}::${record.channel || ''}::${record.device || ''}`;
    if (sourceType === 'meta_ads' || sourceType === 'google_ads')
        // Ads: platform_id (campaign/ad ID) varsa onu kullan — en güvenilir benzersiz tanımlayıcı.
        // Yoksa tüm metrik değerlerini de dahil et ki gerçek tekrarları yakala.
        return `ads::${record.platform || ''}::${record.platform_id || ''}::${record.date || ''}::${record.campaign_name || ''}::${record.adset || record.ad_group || ''}::${record.ad_name || ''}::${record.impressions ?? ''}::${record.clicks ?? ''}::${record.spend ?? ''}`;
    if (sourceType === 'funnel')
        return `funnel::${record.date || ''}::${record.channel || ''}::${record.device || ''}::${record.step_order || ''}::${record.step_name || ''}`;
    return null;
};

const validateNormalizedRecord = (sourceType, record) => {
    const details = [];
    const requiredFields = getRequiredFields(sourceType);

    for (const field of requiredFields) {
        const value = record[field];
        if (value === null || value === undefined || value === '') {
            details.push({ field, message: 'Zorunlu alan bos.' });
        }
    }

    if (sourceType === 'sales') {
        if (!record.order_date) details.push({ field: 'order_date', message: 'Gecersiz tarih.' });
        if (!record.order_id) details.push({ field: 'order_id', message: 'Siparis ID gerekli.' });
        if (record.order_revenue < 0) details.push({ field: 'order_revenue', message: 'Negatif ciro kabul edilmez.' });
    }

    if (sourceType === 'google_analytics') {
        if (!record.date) details.push({ field: 'date', message: 'Gecersiz tarih.' });
        if (record.sessions < 0 || record.users < 0) details.push({ field: 'sessions', message: 'Negatif trafik degeri kabul edilmez.' });
    }

    if (sourceType === 'meta_ads' || sourceType === 'google_ads') {
        if (!record.date) details.push({ field: 'date', message: 'Gecersiz tarih.' });
        if (record.impressions < record.clicks) details.push({ field: 'clicks', message: 'Tiklama, gosterimden buyuk olamaz.' });
        if (record.spend < 0) details.push({ field: 'spend', message: 'Negatif harcama kabul edilmez.' });
    }

    if (sourceType === 'funnel') {
        if (!record.date) details.push({ field: 'date', message: 'Gecersiz tarih.' });
        if ((record.step_order || 0) <= 0) details.push({ field: 'step_order', message: 'Adim sirasi 1 veya daha buyuk olmali.' });
    }

    return details;
};

const findDatabaseDuplicate = async (sourceType, record) => {
    // Sales: order_id gerçek bir benzersiz anahtardır, import'tan bağımsız kontrol et.
    if (sourceType === 'sales' && record.order_id) {
        return SalesData.findOne({ where: { order_id: record.order_id }, attributes: ['id'], raw: true });
    }

    // Google Analytics: aynı import_id içinde zaten in-file duplicate kontrolü var.
    // DB kontrolü: aynı tarih+kaynak+medium+kampanya+kanal+cihaz kombinasyonu başka bir import'ta var mı?
    if (sourceType === 'google_analytics') {
        if (!record.import_id) return null;
        return TrafficData.findOne({
            where: {
                date: record.date,
                source: record.source || null,
                medium: record.medium || null,
                campaign_name: record.campaign_name || null,
                channel: record.channel || null,
                device: record.device || null,
                // Farklı import'larda aynı satır zaten doğal duplicate sayılır.
                import_id: { [Op.ne]: record.import_id }
            },
            attributes: ['id'],
            raw: true
        });
    }

    // Ads (Meta / Google Ads):
    // platform_id varsa en güvenilir kıstas; yoksa tüm boyutlarla kontrol et.
    // Ancak DB duplicate kontrolünü SADECE farklı import'lara karşı yap —
    // silip tekrar yükleyen kullanıcılar yanlış bloke edilir aksi takdirde.
    if (sourceType === 'meta_ads' || sourceType === 'google_ads') {
        if (!record.import_id) return null;
        const where = {
            platform: record.platform,
            date: record.date,
            campaign_name: record.campaign_name,
            import_id: { [Op.ne]: record.import_id }
        };
        // platform_id varsa ekle (en güvenilir benzersiz tanımlayıcı)
        if (record.platform_id) where.platform_id = record.platform_id;
        // Yoksa diğer boyutlarla daralt
        if (!record.platform_id) {
            if (record.adset)    where.adset    = record.adset;
            if (record.ad_group) where.ad_group = record.ad_group;
            if (record.ad_name)  where.ad_name  = record.ad_name;
        }
        return AdsData.findOne({ where, attributes: ['id'], raw: true });
    }

    // Funnel: step_order + step_name + kanal + cihaz kombinasyonu
    if (sourceType === 'funnel') {
        if (!record.import_id) return null;
        return FunnelData.findOne({
            where: {
                date: record.date,
                channel: record.channel || null,
                device: record.device || null,
                step_order: record.step_order,
                import_id: { [Op.ne]: record.import_id }
            },
            attributes: ['id'],
            raw: true
        });
    }

    return null;
};

// analyzeImport: sadece dosya icindeki dogrulama ve duplicate kontrolu yapar.
// DB'ye seri sorgu atilmaz — N+1 sorgu felaketi onlenmistir.
const analyzeImport = async (importLog) => {
    const rows = await parseImportFile(importLog);
    const records = buildNormalizedRecords(rows, importLog);
    const seen = new Set();
    const validRecords = [];
    const errors = [];

    for (const item of records) {
        const rowErrors = validateNormalizedRecord(importLog.source_type, item.normalized);
        const duplicateKey = getDuplicateKey(importLog.source_type, item.normalized);

        if (duplicateKey && seen.has(duplicateKey)) {
            rowErrors.push({ field: 'duplicate', message: 'Ayni kayit dosya icinde tekrar ediyor.' });
        }

        if (duplicateKey) {
            seen.add(duplicateKey);
        }

        if (rowErrors.length > 0) {
            errors.push({
                row_number: item.row_number,
                raw: item.raw,
                details: rowErrors
            });
        } else {
            validRecords.push(item.normalized);
        }
    }

    return {
        rowCount: rows.length,
        validRecords,
        errors
    };
};

const ensureImportOwnership = async (req, id) => {
    const importLog = await ImportLog.findByPk(id);
    if (!importLog) return null;
    if (req.user.role !== 'admin' && importLog.user_id !== req.user.id) return 'FORBIDDEN';
    return importLog;
};

const writeAudit = async (req, action, entityId, payload = {}) => {
    try {
        await AuditLog.create({
            user_id: req.user?.id || null,
            action,
            entity_type: 'import',
            entity_id: String(entityId),
            ip_address: req.ip,
            user_agent: req.get('User-Agent')?.slice(0, 500),
            payload
        });
    } catch (_) {
        // Ana akis durmasin.
    }
};

const listImports = async (req, res) => {
    try {
        const page = parseInt(req.query.page || '1', 10);
        const limit = parseInt(req.query.limit || '20', 10);
        const where = req.user.role === 'admin' ? {} : { user_id: req.user.id };

        const { count, rows } = await ImportLog.findAndCountAll({
            where,
            order: [['created_at', 'DESC']],
            limit,
            offset: (page - 1) * limit
        });

        return paginatedResponse(res, rows, page, limit, count);
    } catch (err) {
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'Import listesi getirilemedi.');
    }
};

const getImportById = async (req, res) => {
    try {
        const importLog = await ensureImportOwnership(req, req.params.id);
        if (!importLog) return errorResponse(res, 404, 'NOT_FOUND', 'Import kaydi bulunamadi.');
        if (importLog === 'FORBIDDEN') return errorResponse(res, 403, 'FORBIDDEN', 'Bu import kaydina erisim yetkiniz yok.');
        return successResponse(res, importLog);
    } catch (err) {
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'Import detayi getirilemedi.');
    }
};

const uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return errorResponse(res, 400, 'NO_FILE', 'Lutfen bir dosya yukleyin.');
        }

        const fileType = getFileType(req.file.originalname);
        const importLog = await ImportLog.create({
            user_id: req.user.id,
            file_name: req.file.filename,
            file_type: fileType,
            source_type: req.body.source_type || 'sales',
            row_count: 0,
            status: 'pending',
            error_detail: [],
            error_count: 0
        });

        await writeAudit(req, 'import_upload', importLog.id, { source_type: importLog.source_type, file_type: importLog.file_type });

        return successResponse(res, {
            id: importLog.id,
            file_name: importLog.file_name,
            file_type: importLog.file_type,
            status: importLog.status,
            message: 'Dosya basariyla yuklendi.'
        });
    } catch (err) {
        console.error('[IMPORT] Upload hatasi:', err);
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'Dosya yukleme sirasinda hata olustu.');
    }
};

const getPreview = async (req, res) => {
    try {
        const importLog = await ensureImportOwnership(req, req.params.id);
        if (!importLog) return errorResponse(res, 404, 'NOT_FOUND', 'Import kaydi bulunamadi.');
        if (importLog === 'FORBIDDEN') return errorResponse(res, 403, 'FORBIDDEN', 'Bu import kaydina erisim yetkiniz yok.');

        const parsedData = await parseImportFile(importLog);
        const previewData = parsedData.slice(0, 20);
        const headers = Object.keys(previewData[0] || {});

        return successResponse(res, {
            id: importLog.id,
            file_name: importLog.file_name,
            preview: previewData,
            suggested_mapping: suggestMapping(importLog.source_type, headers),
            target_fields: getSourceFields(importLog.source_type)
        });
    } catch (err) {
        if (err.message === 'FILE_NOT_FOUND') {
            return errorResponse(res, 404, 'FILE_NOT_FOUND', 'Dosya sunucuda bulunamadi.');
        }

        console.error('[IMPORT] Preview hatasi:', err);
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'Onizleme okunamadi.');
    }
};

const mapColumns = async (req, res) => {
    try {
        const importLog = await ensureImportOwnership(req, req.params.id);
        if (!importLog) return errorResponse(res, 404, 'NOT_FOUND', 'Kayit bulunamadi.');
        if (importLog === 'FORBIDDEN') return errorResponse(res, 403, 'FORBIDDEN', 'Bu import kaydina erisim yetkiniz yok.');

        await importLog.update({
            mapping_config: req.body.mapping || {},
            status: 'mapping'
        });

        return successResponse(res, { message: 'Esleme kaydedildi.' });
    } catch (err) {
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'Esleme kaydedilemedi.');
    }
};

const validateImport = async (req, res) => {
    try {
        const importLog = await ensureImportOwnership(req, req.params.id);
        if (!importLog) return errorResponse(res, 404, 'NOT_FOUND', 'Kayit bulunamadi.');
        if (importLog === 'FORBIDDEN') return errorResponse(res, 403, 'FORBIDDEN', 'Bu import kaydina erisim yetkiniz yok.');

        const mapping = importLog.mapping_config || {};
        const mappedTargets = new Set(Object.values(mapping).filter(Boolean));
        const missingFields = getRequiredFields(importLog.source_type).filter((field) => !mappedTargets.has(field));

        if (missingFields.length > 0) {
            return errorResponse(res, 400, 'MISSING_REQUIRED_MAPPING', `Zorunlu kolon eslesmeleri eksik: ${missingFields.join(', ')}`);
        }

        const analysis = await analyzeImport(importLog);
        const nextStatus = analysis.validRecords.length > 0 ? 'processing' : 'failed';

        await importLog.update({
            status: nextStatus,
            row_count: analysis.rowCount,
            error_count: analysis.errors.length,
            error_detail: analysis.errors
        });

        await writeAudit(req, 'import_validate', importLog.id, { row_count: analysis.rowCount, error_count: analysis.errors.length });

        return successResponse(res, {
            valid: analysis.validRecords.length > 0,
            row_count: analysis.rowCount,
            valid_row_count: analysis.validRecords.length,
            error_count: analysis.errors.length,
            errors: analysis.errors.slice(0, 20),
            message: analysis.errors.length === 0
                ? 'Doğrulama başarılı. Veri commit için hazır.'
                : `${analysis.validRecords.length} geçerli, ${analysis.errors.length} hatalı satır bulundu. Hatalı olanlar atlanarak commit yapılabilir.`
        });
    } catch (err) {
        if (err.message === 'FILE_NOT_FOUND') {
            return errorResponse(res, 404, 'FILE_NOT_FOUND', 'Dosya sunucuda bulunamadi.');
        }
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'Dogrulama hatasi.');
    }
};

const getErrors = async (req, res) => {
    try {
        const importLog = await ensureImportOwnership(req, req.params.id);
        if (!importLog) return errorResponse(res, 404, 'NOT_FOUND', 'Kayit bulunamadi.');
        if (importLog === 'FORBIDDEN') return errorResponse(res, 403, 'FORBIDDEN', 'Bu import kaydina erisim yetkiniz yok.');
        return successResponse(res, { errors: importLog.error_detail || [] });
    } catch (err) {
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'Hatalar okunamadi.');
    }
};

// Yardimci: buyuk dizileri kucuk parcalara (chunk) bolerek toplu insert yapar.
const bulkInsertChunked = async (Model, records, chunkSize = 500) => {
    for (let i = 0; i < records.length; i += chunkSize) {
        const chunk = records.slice(i, i + chunkSize);
        await Model.bulkCreate(chunk, { ignoreDuplicates: true });
    }
};

const commitImport = async (req, res) => {
    try {
        const importLog = await ensureImportOwnership(req, req.params.id);
        if (!importLog) return errorResponse(res, 404, 'NOT_FOUND', 'Kayit bulunamadi.');
        if (importLog === 'FORBIDDEN') return errorResponse(res, 403, 'FORBIDDEN', 'Bu import kaydina erisim yetkiniz yok.');

        if (importLog.status === 'completed') {
            return errorResponse(res, 400, 'ALREADY_COMPLETED', 'Bu dosya zaten sisteme islenmis.');
        }

        const targetTable = resolveTargetModel(importLog.source_type);
        if (!targetTable) {
            return errorResponse(res, 400, 'INVALID_SOURCE', 'Gecersiz veri kaynagi.');
        }

        // Validate adiminda hesaplanan sonuclar ImportLog'da sakli — tekrar analiz etmeye gerek yok.
        // Ancak dosya hala 'processing' durumundaysa (validate gececli gectiyse) dogrudan kayded.
        const savedErrorCount  = importLog.error_count  || 0;
        const savedRowCount    = importLog.row_count    || 0;
        const savedErrors      = importLog.error_detail || [];

        // Dosyayi okuyup gecerli kayitlari yeniden olustur (sadece dosya okuma + normalize, DB sorgusu yok)
        const analysis = await analyzeImport(importLog);

        if (analysis.validRecords.length === 0) {
            await importLog.update({
                status: 'failed',
                row_count: analysis.rowCount,
                error_count: analysis.errors.length,
                error_detail: analysis.errors.slice(0, 500) // JSON boyutunu sinirla
            });
            return errorResponse(res, 422, 'NO_VALID_RECORDS', 'Gecerli satir bulunamadi, tum satirlar hatali.', analysis.errors.slice(0, 20));
        }

        // 500'er satirlik parcalarla insert et — buyuk dosyalarda timeout onlenir
        await bulkInsertChunked(targetTable, analysis.validRecords, 500);
        await KpiCache.destroy({ where: {} });

        await importLog.update({
            status: 'completed',
            completed_at: new Date(),
            row_count: analysis.rowCount,
            error_count: analysis.errors.length,
            error_detail: analysis.errors.slice(0, 500) // JSON boyutunu sinirla
        });

        await writeAudit(req, 'import_commit', importLog.id, {
            valid_rows: analysis.validRecords.length,
            error_rows: analysis.errors.length,
            source_type: importLog.source_type
        });

        return successResponse(res, {
            message: analysis.errors.length > 0
                ? `${analysis.validRecords.length} satir kaydedildi, ${analysis.errors.length} satir atlandi.`
                : 'Tum veriler basariyla kaydedildi.',
            valid_row_count: analysis.validRecords.length,
            error_count: analysis.errors.length,
            errors: analysis.errors.slice(0, 20)
        });
    } catch (err) {
        console.error('[IMPORT COMMIT] Error:', err);
        return errorResponse(res, 500, 'INTERNAL_ERROR', `Kaydedilirken hata olustu: ${err.message}`);
    }
};

const deleteImport = async (req, res) => {
    try {
        const importLog = await ensureImportOwnership(req, req.params.id);
        if (!importLog) return errorResponse(res, 404, 'NOT_FOUND', 'Kayit bulunamadi.');
        if (importLog === 'FORBIDDEN') return errorResponse(res, 403, 'FORBIDDEN', 'Bu import kaydina erisim yetkiniz yok.');

        for (const Model of IMPORT_MODELS) {
            await Model.destroy({ where: { import_id: importLog.id } });
        }

        const filePath = path.join(__dirname, '../../uploads', importLog.file_name);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await importLog.destroy();
        await KpiCache.destroy({ where: {} });
        await writeAudit(req, 'import_delete', req.params.id, { source_type: importLog.source_type });

        return successResponse(res, { message: 'Kayit ve ilgili veriler silindi.' });
    } catch (err) {
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'Silme sirasinda hata.');
    }
};

const purgeOrphanData = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return errorResponse(res, 403, 'FORBIDDEN', 'Zombi verileri temizleme yetkisi sadece adminlere aittir.');
        }

        let totalDeleted = 0;
        for (const Model of IMPORT_MODELS) {
            const deletedCount = await Model.destroy({ where: { import_id: null } });
            totalDeleted += deletedCount;
        }

        await KpiCache.destroy({ where: {} });
        await writeAudit(req, 'purge_orphan_data', 'all', { deleted_rows: totalDeleted });

        return successResponse(res, { message: `${totalDeleted} adet sahipsiz kayit veritabanindan temizlendi.` });
    } catch (err) {
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'Sahipsiz veriler temizlenirken hata olustu.');
    }
};

module.exports = {
    listImports,
    getImportById,
    uploadFile,
    getPreview,
    mapColumns,
    validateImport,
    getErrors,
    commitImport,
    deleteImport,
    purgeOrphanData
};
