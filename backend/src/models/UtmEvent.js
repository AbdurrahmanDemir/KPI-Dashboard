const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UtmEvent = sequelize.define(
    'UtmEvent',
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        utm_link_id: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
        },
        event_type: {
            type: DataTypes.ENUM('click', 'lead', 'sale'),
            allowNull: false,
        },
        event_source: {
            type: DataTypes.ENUM('tracking_redirect', 'manual_simulation', 'public_event_api'),
            allowNull: false,
            defaultValue: 'tracking_redirect',
        },
        revenue: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
            defaultValue: 0,
        },
        session_key: {
            type: DataTypes.STRING(120),
            allowNull: true,
        },
        referrer: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
        device_type: {
            type: DataTypes.STRING(40),
            allowNull: true,
        },
        metadata: {
            type: DataTypes.JSON,
            allowNull: true,
        },
        occurred_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        tableName: 'utm_events',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            { fields: ['utm_link_id'] },
            { fields: ['event_type'] },
            { fields: ['occurred_at'] },
            { fields: ['event_source'] },
        ],
    }
);

module.exports = UtmEvent;
