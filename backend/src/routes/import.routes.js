const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { 
    uploadFile, 
    getPreview, 
    mapColumns, 
    validateImport, 
    getErrors, 
    commitImport, 
    deleteImport 
} = require('../controllers/import.controller');
const { authenticate } = require('../middleware/auth');

// Upload destination
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'text/csv', 
        'application/json', 
        'application/vnd.ms-excel', 
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(csv|json|xlsx|xls)$/)) {
        cb(null, true);
    } else {
        cb(new Error('Sadece CSV, JSON ve Excel dosyaları yüklenebilir.'), false);
    }
};

const upload = multer({ 
    storage,
    limits: { fileSize: parseInt(process.env.UPLOAD_MAX_SIZE_MB || 50) * 1024 * 1024 },
    fileFilter
});

/**
 * @swagger
 * tags:
 *   name: Imports
 *   description: Veri içe aktarma işlemleri
 */

/**
 * @swagger
 * /imports:
 *   post:
 *     summary: Dosya yükleme
 *     description: CSV, JSON veya XLSX dosyası yükler ve import_logs'a kaydeder.
 *     tags: [Imports]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               source_type:
 *                 type: string
 *                 description: google_analytics, meta_ads, google_ads, sales, funnel
 *     responses:
 *       200:
 *         description: Dosya başarıyla yüklendi
 */
router.post('/', authenticate, upload.single('file'), uploadFile);

/**
 * @swagger
 * /imports/{id}/preview:
 *   get:
 *     summary: Import verisi önizleme
 *     description: Yüklenen dosyanın ilk 20 satırını döndürür.
 *     tags: [Imports]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Önizleme verisi
 */
router.get('/:id/preview', authenticate, getPreview);
/**
 * @swagger
 * /imports/{id}/map-columns:
 *   post:
 *     summary: Kolon eşleme kaydet
 *     tags: [Imports]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mapping:
 *                 type: object
 *     responses:
 *       200:
 *         description: Eşleme kaydedildi
 */
router.post('/:id/map-columns', authenticate, mapColumns);

/**
 * @swagger
 * /imports/{id}/validate:
 *   post:
 *     summary: Veri doğrula
 *     tags: [Imports]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Doğrulama yapıldı
 */
router.post('/:id/validate', authenticate, validateImport);

/**
 * @swagger
 * /imports/{id}/errors:
 *   get:
 *     summary: Hatalı satırları getir
 *     tags: [Imports]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Hata listesi
 */
router.get('/:id/errors', authenticate, getErrors);

/**
 * @swagger
 * /imports/{id}/commit:
 *   post:
 *     summary: Veriyi veritabanına yaz
 *     tags: [Imports]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Kayıt başarılı
 */
router.post('/:id/commit', authenticate, commitImport);

/**
 * @swagger
 * /imports/{id}:
 *   delete:
 *     summary: Import kaydını sil/geri al
 *     tags: [Imports]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Silme işlemi başarılı
 */
router.delete('/:id', authenticate, deleteImport);

module.exports = router;
