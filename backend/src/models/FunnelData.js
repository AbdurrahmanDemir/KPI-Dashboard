const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FunnelData = sequelize.define(
    'FunnelData',
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
        channel: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        device: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        step_name: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        step_order: {
            type: DataTypes.TINYINT.UNSIGNED,
            allowNull: false,
        },
        session_count: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 0,
        },
        import_id: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: true,
        },
    },
    {
        tableName: 'funnel_data',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false,
        indexes: [
            { fields: ['date'] },
            { fields: ['step_order'] },
            { fields: ['date', 'channel'] },
        ],
    }
);

module.exports = FunnelData;
