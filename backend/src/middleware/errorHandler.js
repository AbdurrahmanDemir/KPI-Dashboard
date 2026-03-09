/**
 * Merkezi hata yönetim middleware'i
 */
const errorHandler = (err, req, res, next) => {
    console.error(`[ERROR] ${req.method} ${req.url}:`, err.message);

    // Sequelize validation hatası
    if (err.name === 'SequelizeValidationError') {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Veri doğrulama hatası',
                details: err.errors.map((e) => ({
                    field: e.path,
                    message: e.message,
                })),
            },
        });
    }

    // Sequelize unique constraint hatası
    if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({
            success: false,
            error: {
                code: 'DUPLICATE_ERROR',
                message: 'Bu kayıt zaten mevcut',
                details: err.errors.map((e) => ({
                    field: e.path,
                    message: e.message,
                })),
            },
        });
    }

    // JWT hatası
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            error: {
                code: 'INVALID_TOKEN',
                message: 'Token geçersiz veya süresi dolmuş',
                details: [],
            },
        });
    }

    // Multer dosya boyutu hatası
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
            success: false,
            error: {
                code: 'FILE_TOO_LARGE',
                message: `Dosya boyutu ${process.env.UPLOAD_MAX_SIZE_MB || 50}MB limitini aşıyor`,
                details: [],
            },
        });
    }

    // Genel sunucu hatası
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
        success: false,
        error: {
            code: err.code || 'INTERNAL_SERVER_ERROR',
            message:
                process.env.NODE_ENV === 'development'
                    ? err.message
                    : 'Sunucu hatası oluştu',
            details: [],
        },
    });
};

/**
 * 404 Not Found middleware
 */
const notFound = (req, res) => {
    return res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: `${req.method} ${req.url} endpoint'i bulunamadı`,
            details: [],
        },
    });
};

module.exports = { errorHandler, notFound };
