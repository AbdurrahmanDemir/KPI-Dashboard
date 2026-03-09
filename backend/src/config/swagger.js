const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'KPI Dashboard API',
            version: '2.0.0',
            description: 'Pazarlama ve E-Ticaret KPI Dashboard REST API Dokümantasyonu',
            contact: {
                name: 'Sporthink',
                email: 'emre.yavsan@sporthink.com.tr',
            },
        },
        servers: [
            {
                url: `http://localhost:${process.env.PORT || 3001}`,
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'JWT Access Token. Format: Bearer {token}',
                },
            },
            responses: {
                UnauthorizedError: {
                    description: 'Token geçersiz veya eksik',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ErrorResponse',
                            },
                        },
                    },
                },
            },
            schemas: {
                SuccessResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        data: { type: 'object' },
                        meta: {
                            type: 'object',
                            properties: {
                                page: { type: 'integer', example: 1 },
                                total: { type: 'integer', example: 150 },
                                timestamp: { type: 'string', format: 'date-time' },
                            },
                        },
                    },
                },
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        error: {
                            type: 'object',
                            properties: {
                                code: { type: 'string', example: 'VALIDATION_ERROR' },
                                message: { type: 'string', example: 'Açıklayıcı hata mesajı' },
                                details: { type: 'array', items: { type: 'object' } },
                            },
                        },
                    },
                },
            },
        },
        security: [{ BearerAuth: [] }],
    },
    apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);
module.exports = swaggerSpec;
