const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UtmLink = sequelize.define(
    'UtmLink',
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
        name: {
            type: DataTypes.STRING(160),
            allowNull: false,
        },
        tracking_code: {
            type: DataTypes.STRING(32),
            allowNull: false,
            unique: true,
        },
        destination_url: {
            type: DataTypes.STRING(1000),
            allowNull: false,
        },
        utm_source: {
            type: DataTypes.STRING(120),
            allowNull: false,
        },
        utm_medium: {
            type: DataTypes.STRING(120),
            allowNull: false,
        },
        utm_campaign: {
            type: DataTypes.STRING(160),
            allowNull: false,
        },
        utm_content: {
            type: DataTypes.STRING(160),
            allowNull: true,
        },
        utm_term: {
            type: DataTypes.STRING(160),
            allowNull: true,
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
    },
    {
        tableName: 'utm_links',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            { unique: true, fields: ['tracking_code'] },
            { fields: ['utm_source'] },
            { fields: ['utm_medium'] },
            { fields: ['utm_campaign'] },
            { fields: ['is_active'] },
        ],
    }
);

module.exports = UtmLink;
