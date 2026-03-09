const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const KpiCache = sequelize.define(
    'KpiCache',
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        kpi_type: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        date_start: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        date_end: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        filters_hash: {
            type: DataTypes.STRING(64),
            allowNull: false,
            comment: 'Filtre kombinasyonunun MD5 hash\'i',
        },
        value: {
            type: DataTypes.JSON,
            allowNull: false,
        },
        calculated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        expires_at: {
            type: DataTypes.DATE,
            allowNull: false,
        },
    },
    {
        tableName: 'kpi_cache',
        timestamps: false,
        indexes: [
            {
                unique: true,
                fields: ['kpi_type', 'date_start', 'date_end', 'filters_hash'],
                name: 'uq_kpi_filter',
            },
            { fields: ['expires_at'] },
        ],
    }
);

module.exports = KpiCache;
