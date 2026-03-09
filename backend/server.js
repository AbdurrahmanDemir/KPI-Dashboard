require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');

const { connectDB } = require('./src/config/database');
const swaggerSpec = require('./src/config/swagger');

// Modelleri yükle (ilişkiler dahil)
require('./src/models/index');
const { errorHandler, notFound } = require('./src/middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Güvenlik Middleware'leri ─────────────────────────────────────────────────
app.use(helmet());
app.use(
    cors({
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    })
);

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 1000, // 1 dakika
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Çok fazla istek gönderildi. 1 dakika bekleyip tekrar deneyin.',
            details: [],
        },
    },
});
app.use('/api', limiter);

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Loglama ─────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// ─── Swagger UI ───────────────────────────────────────────────────────────────
app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
        explorer: true,
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'KPI Dashboard API',
    })
);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./src/routes/auth.routes'));
// Hafta 4-7'de aktif edilecek:
// app.use('/api/imports', require('./src/routes/import.routes'));
// app.use('/api/kpi', require('./src/routes/kpi.routes'));
// app.use('/api/dashboard', require('./src/routes/dashboard.routes'));
// app.use('/api/filters', require('./src/routes/filter.routes'));
// app.use('/api/views', require('./src/routes/view.routes'));
// app.use('/api/segments', require('./src/routes/segment.routes'));
// app.use('/api/export', require('./src/routes/export.routes'));
// app.use('/api/logs', require('./src/routes/log.routes'));
// app.use('/api/mappings', require('./src/routes/mapping.routes'));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
    res.json({
        success: true,
        data: {
            status: 'OK',
            environment: process.env.NODE_ENV,
            version: '2.0.0',
            timestamp: new Date().toISOString(),
        },
    });
});

// ─── Root ─────────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
    res.json({
        success: true,
        data: {
            message: 'KPI Dashboard API çalışıyor 🚀',
            docs: `http://localhost:${PORT}/api-docs`,
            health: `http://localhost:${PORT}/health`,
        },
    });
});

// ─── 404 & Error Handler ─────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Server Başlatma ─────────────────────────────────────────────────────────
const startServer = async () => {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`\n🚀 KPI Dashboard API çalışıyor`);
        console.log(`   ├── Server:  http://localhost:${PORT}`);
        console.log(`   ├── Swagger: http://localhost:${PORT}/api-docs`);
        console.log(`   ├── Health:  http://localhost:${PORT}/health`);
        console.log(`   └── ENV:     ${process.env.NODE_ENV}\n`);
    });
};

startServer();

module.exports = app;
