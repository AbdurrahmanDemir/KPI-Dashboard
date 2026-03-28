const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SalesData = sequelize.define(
    'SalesData',
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        order_id: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
        },
        order_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        customer_id: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        city: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        country: {
            type: DataTypes.STRING(10),
            allowNull: true,
        },
        device: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        channel: {
            type: DataTypes.STRING(100),
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
        campaign_name: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        product_name: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        product_category: {
            type: DataTypes.STRING(150),
            allowNull: true,
        },
        product_sku: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        product_count: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 1,
        },
        order_revenue: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
            defaultValue: 0.0,
        },
        discount_amount: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
            defaultValue: 0.0,
        },
        refund_amount: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
            defaultValue: 0.0,
        },
        order_status: {
            type: DataTypes.ENUM('completed', 'cancelled', 'refunded'),
            allowNull: false,
            defaultValue: 'completed',
        },
        payment_method: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        attribution_source: {
            type: DataTypes.ENUM('analytics', 'ads_platform', 'manual'),
            allowNull: false,
            defaultValue: 'analytics',
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
        tableName: 'sales_data',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false,
        indexes: [
            { fields: ['order_date'] },
            { fields: ['customer_id'] },
            { fields: ['channel'] },
            { fields: ['source'] },
            { fields: ['medium'] },
            { fields: ['campaign_name'] },
            { fields: ['product_name'] },
            { fields: ['product_category'] },
            { fields: ['city'] },
            { fields: ['country'] },
            { fields: ['order_status'] },
        ],
    }
);

module.exports = SalesData;
