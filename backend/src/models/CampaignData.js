const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CampaignData = sequelize.define(
    'CampaignData',
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        campaign_name: {
            type: DataTypes.STRING(255),
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
        start_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        end_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        budget: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
        },
        budget_type: {
            type: DataTypes.ENUM('daily', 'lifetime'),
            allowNull: false,
            defaultValue: 'daily',
        },
        objective: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        target_roas: {
            type: DataTypes.DECIMAL(10, 4),
            allowNull: true,
        },
        currency: {
            type: DataTypes.STRING(3),
            allowNull: false,
            defaultValue: 'TRY',
        },
        status: {
            type: DataTypes.ENUM('active', 'paused', 'ended'),
            allowNull: false,
            defaultValue: 'active',
        },
    },
    {
        tableName: 'campaign_data',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            { fields: ['platform'] },
            { fields: ['status'] },
            { fields: ['start_date', 'end_date'] },
            { unique: true, fields: ['campaign_name', 'platform'], name: 'uq_campaign_platform' },
        ],
    }
);

module.exports = CampaignData;
