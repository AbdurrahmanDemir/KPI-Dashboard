const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AdsData = sequelize.define(
    'AdsData',
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
        platform: {
            type: DataTypes.ENUM('meta', 'google_ads'),
            allowNull: false,
        },
        platform_id: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        campaign_name: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        adset: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        ad_name: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        ad_group: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        impressions: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 0,
        },
        clicks: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 0,
        },
        reach: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 0,
        },
        spend: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
            defaultValue: 0.0,
        },
        ctr: {
            type: DataTypes.DECIMAL(8, 6),
            allowNull: false,
            defaultValue: 0.0,
        },
        cpc: {
            type: DataTypes.DECIMAL(10, 4),
            allowNull: false,
            defaultValue: 0.0,
        },
        avg_cpc: {
            type: DataTypes.DECIMAL(10, 4),
            allowNull: false,
            defaultValue: 0.0,
        },
        conversions: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 0,
        },
        conversion_value: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
            defaultValue: 0.0,
        },
        currency: {
            type: DataTypes.STRING(3),
            allowNull: false,
            defaultValue: 'TRY',
        },
        raw_payload: {
            type: DataTypes.JSON,
            allowNull: true,
        },
        import_id: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: true,
        },
    },
    {
        tableName: 'ads_data',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false,
        indexes: [
            { fields: ['date'] },
            { fields: ['platform'] },
            { fields: ['campaign_name'] },
            { fields: ['date', 'platform'] },
        ],
    }
);

module.exports = AdsData;
