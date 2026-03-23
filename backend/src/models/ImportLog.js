const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ImportLog = sequelize.define(
    'ImportLog',
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        user_id: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
        },
        file_name: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        file_type: {
            type: DataTypes.ENUM('csv', 'xlsx', 'json'),
            allowNull: false,
        },
        source_type: {
            type: DataTypes.ENUM(
                'google_analytics',
                'meta_ads',
                'google_ads',
                'sales',
                'funnel'
            ),
            allowNull: false,
        },
        row_count: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 0,
        },
        error_count: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 0,
        },
        status: {
            type: DataTypes.ENUM('pending', 'mapping', 'processing', 'completed', 'failed'),
            allowNull: false,
            defaultValue: 'pending',
        },
        mapping_config: {
            type: DataTypes.JSON,
            allowNull: true,
        },
        error_detail: {
            type: DataTypes.JSON,
            allowNull: true,
        },
        completed_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        tableName: 'import_logs',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false,
        indexes: [
            { fields: ['user_id'] },
            { fields: ['status'] },
            { fields: ['created_at'] },
        ],
    }
);

module.exports = ImportLog;
