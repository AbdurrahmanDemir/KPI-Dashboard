const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CustomerData = sequelize.define(
    'CustomerData',
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        customer_id: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
        },
        customer_name: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        first_order_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        registration_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        city: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        gender: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
        age_group: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        registration_source: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        is_newsletter_subscriber: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        total_orders: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 0,
        },
        total_revenue: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
            defaultValue: 0.0,
        },
        last_order_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
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
        tableName: 'customer_data',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false,
        indexes: [
            { fields: ['customer_id'] },
            { fields: ['city'] },
            { fields: ['registration_source'] },
            { fields: ['age_group'] },
        ],
    }
);

module.exports = CustomerData;
