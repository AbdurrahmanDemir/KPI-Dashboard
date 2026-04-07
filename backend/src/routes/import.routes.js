const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
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
} = require('../controllers/import.controller');
const { authenticate, requireRoles } = require('../middleware/auth');

const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
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
        cb(new Error('Sadece CSV, JSON ve Excel dosyalari yuklenebilir.'), false);
    }
};

const upload = multer({
    storage,
    limits: { fileSize: parseInt(process.env.UPLOAD_MAX_SIZE_MB || 50, 10) * 1024 * 1024 },
    fileFilter
});

router.get('/', authenticate, requireRoles('admin', 'marketing_manager'), listImports);
router.post('/', authenticate, requireRoles('admin', 'marketing_manager'), upload.single('file'), uploadFile);
router.delete('/purge', authenticate, requireRoles('admin'), purgeOrphanData);
router.get('/:id', authenticate, requireRoles('admin', 'marketing_manager'), getImportById);
router.get('/:id/preview', authenticate, requireRoles('admin', 'marketing_manager'), getPreview);
router.post('/:id/map-columns', authenticate, requireRoles('admin', 'marketing_manager'), mapColumns);
router.post('/:id/validate', authenticate, requireRoles('admin', 'marketing_manager'), validateImport);
router.get('/:id/errors', authenticate, requireRoles('admin', 'marketing_manager'), getErrors);
router.post('/:id/commit', authenticate, requireRoles('admin', 'marketing_manager'), commitImport);
router.delete('/:id', authenticate, requireRoles('admin', 'marketing_manager'), deleteImport);

module.exports = router;
