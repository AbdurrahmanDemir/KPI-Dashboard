const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AuditLog = sequelize.define(
    'AuditLog',
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        user_id: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: true,
        },
        action: {
            type: DataTypes.STRING(100),
            allowNull: false,
            comment: 'import, delete, login, failed_login vb.',
        },
        entity_type: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: 'import, segment, view vb.',
        },
        entity_id: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        ip_address: {
            type: DataTypes.STRING(45),
            allowNull: true,
        },
        user_agent: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
        payload: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'İşlem detayları',
        },
    },
    {
        tableName: 'audit_logs',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false,
        indexes: [
            { fields: ['user_id'] },
            { fields: ['action'] },
            { fields: ['created_at'] },
        ],
    }
);

module.exports = AuditLog;
