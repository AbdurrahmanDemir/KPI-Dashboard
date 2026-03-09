const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TrafficData = sequelize.define(
    'TrafficData',
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        source: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        medium: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        channel_group: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        channel: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        sessions: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 0,
        },
        users: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 0,
        },
        new_users: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 0,
        },
        bounce_rate: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: false,
            defaultValue: 0.0,
        },
        avg_session_duration: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.0,
        },
        pages_per_session: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: false,
            defaultValue: 0.0,
        },
        pages_viewed: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 0,
        },
        conversions: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 0,
        },
        revenue: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
            defaultValue: 0.0,
        },
        import_id: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: true,
        },
    },
    {
        tableName: 'traffic_data',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false,
        indexes: [
            { fields: ['date'] },
            { fields: ['channel'] },
            { fields: ['source', 'medium'] },
            { fields: ['date', 'channel'] },
        ],
    }
);

module.exports = TrafficData;
