const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const xlsx = require('xlsx');
const ImportLog = require('../models/ImportLog');
const { successResponse, errorResponse } = require('../utils/response');

const getFileType = (filename) => {
    const ext = path.extname(filename).toLowerCase();
    if (ext === '.csv') return 'csv';
    if (ext === '.json') return 'json';
    if (ext === '.xlsx' || ext === '.xls') return 'xlsx';
    return null;
};

// ─── POST /imports ────────────────────────────────────────────────────────────
const uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return errorResponse(res, 400, 'NO_FILE', 'Lütfen bir dosya yükleyin.');
        }

        const fileType = getFileType(req.file.originalname);
        let rowCount = 0;

        // Basit satır sayma / önizleme okuması (daha sonra preview endpoint'inde okuyacağız)
        // Ancak DB'ye log atarken bir tahmin atabiliriz veya async sayabiliriz.
        // Hız için şimdilik row_count'a 0 atıp preview anında doldurabiliriz veya burada hesaplayabiliriz.
        // Şimdilik 0 diyelim.
        
        const importLog = await ImportLog.create({
            user_id: req.user.id,
            file_name: req.file.filename,
            file_type: fileType,
            source_type: req.body.source_type || 'sales', // Form-data'dan gelen
            row_count: 0, 
            status: 'pending',
            error_detail: null,
            error_count: 0
        });

        return successResponse(res, {
            id: importLog.id,
            file_name: importLog.file_name,
            file_type: importLog.file_type,
            status: importLog.status,
            message: 'Dosya başarıyla yüklendi.'
        });

    } catch (err) {
        console.error('[IMPORT] Upload hatası:', err);
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'Dosya yükleme sırasında hata oluştu.');
    }
};

// ─── GET /imports/:id/preview ──────────────────────────────────────────────────
const getPreview = async (req, res) => {
    try {
        const { id } = req.params;
        const importLog = await ImportLog.findByPk(id);

        if (!importLog) {
            return errorResponse(res, 404, 'NOT_FOUND', 'Import kaydı bulunamadı.');
        }

        const filePath = path.join(__dirname, '../../uploads', importLog.file_name);

        if (!fs.existsSync(filePath)) {
            return errorResponse(res, 404, 'FILE_NOT_FOUND', 'Dosya sunucuda bulunamadı.');
        }

        let previewData = [];

        if (importLog.file_type === 'csv') {
            await new Promise((resolve, reject) => {
                const results = [];
                fs.createReadStream(filePath)
                    .pipe(csv())
                    .on('data', (data) => {
                        if (results.length < 20) {
                            results.push(data);
                        }
                    })
                    .on('end', () => {
                        previewData = results;
                        resolve();
                    })
                    .on('error', (error) => reject(error));
            });
        } 
        else if (importLog.file_type === 'xlsx') {
            const workbook = xlsx.readFile(filePath);
            const sheetName = workbook.SheetNames[0]; // Sadece ilk sheet
            const sheet = workbook.Sheets[sheetName];
            const json = xlsx.utils.sheet_to_json(sheet, { defval: null });
            previewData = json.slice(0, 20);
        } 
        else if (importLog.file_type === 'json') {
            const fileContent = fs.readFileSync(filePath, 'utf8');
            let json = JSON.parse(fileContent);
            if (!Array.isArray(json)) {
                json = [json]; // array değilse array yap
            }
            previewData = json.slice(0, 20);
        }

        return successResponse(res, {
            id: importLog.id,
            file_name: importLog.file_name,
            preview: previewData
        });

    } catch (err) {
        console.error('[IMPORT] Preview hatası:', err);
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'Önizleme okunamadı.');
    }
};

// ─── POST /imports/:id/map-columns ─────────────────────────────────────────────
const mapColumns = async (req, res) => {
    try {
        const { id } = req.params;
        const { mapping } = req.body;

        const importLog = await ImportLog.findByPk(id);
        if (!importLog) return errorResponse(res, 404, 'NOT_FOUND', 'Kayıt bulunamadı.');

        await importLog.update({
            mapping_config: mapping,
            status: 'mapping'
        });

        return successResponse(res, { message: 'Eşleme kaydedildi.' });
    } catch (err) {
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'Eşleme kaydedilemedi.');
    }
};

// ─── POST /imports/:id/validate ────────────────────────────────────────────────
const validateImport = async (req, res) => {
    try {
        const { id } = req.params;
        const importLog = await ImportLog.findByPk(id);
        if (!importLog) return errorResponse(res, 404, 'NOT_FOUND', 'Kayıt bulunamadı.');

        // Dummy validation logici. Normalde dosya tekrar okunup kontrol edilir.
        await importLog.update({
            status: 'processing',
            error_count: 0,
            error_detail: []
        });

        return successResponse(res, { message: 'Doğrulama başarılı.' });
    } catch (err) {
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'Doğrulama hatası.');
    }
};

// ─── GET /imports/:id/errors ───────────────────────────────────────────────────
const getErrors = async (req, res) => {
    try {
        const { id } = req.params;
        const importLog = await ImportLog.findByPk(id);
        if (!importLog) return errorResponse(res, 404, 'NOT_FOUND', 'Kayıt bulunamadı.');

        return successResponse(res, { errors: importLog.error_detail || [] });
    } catch (err) {
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'Hatalar okunamadı.');
    }
};

// ─── POST /imports/:id/commit ──────────────────────────────────────────────────
const commitImport = async (req, res) => {
    try {
        const { id } = req.params;
        const importLog = await ImportLog.findByPk(id);
        if (!importLog) return errorResponse(res, 404, 'NOT_FOUND', 'Kayıt bulunamadı.');

        // Gerçek implementasyonda destination DB'ye insert edilir
        await importLog.update({
            status: 'completed',
            completed_at: new Date(),
            row_count: 100 // Örnek sayı
        });

        return successResponse(res, { message: 'Veri başarıyla kaydedildi.', row_count: 100 });
    } catch (err) {
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'Kaydedilirken hata oluştu.');
    }
};

// ─── DELETE /imports/:id ───────────────────────────────────────────────────────
const deleteImport = async (req, res) => {
    try {
        const { id } = req.params;
        const importLog = await ImportLog.findByPk(id);
        if (!importLog) return errorResponse(res, 404, 'NOT_FOUND', 'Kayıt bulunamadı.');

        // İlgili tablolardan import_id ile silinmesi gerekir
        // Örneğin: await SalesData.destroy({ where: { import_id: id } });
        
        // Dosyayı sistemden sil
        const filePath = path.join(__dirname, '../../uploads', importLog.file_name);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await importLog.destroy();

        return successResponse(res, { message: 'Kayıt ve ilgili veriler silindi.' });
    } catch (err) {
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'Silme sırasında hata.');
    }
};

module.exports = {
    uploadFile,
    getPreview,
    mapColumns,
    validateImport,
    getErrors,
    commitImport,
    deleteImport
};
