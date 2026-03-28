const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ReportSchedule = sequelize.define(
    'ReportSchedule',
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
            type: DataTypes.STRING(150),
            allowNull: false,
        },
        frequency: {
            type: DataTypes.ENUM('daily', 'weekly', 'monthly'),
            allowNull: false,
            defaultValue: 'weekly',
        },
        recipients: {
            type: DataTypes.JSON,
            allowNull: false,
        },
        filter_config: {
            type: DataTypes.JSON,
            allowNull: true,
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        last_sent_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        last_run_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        last_error: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        tableName: 'report_schedules',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            { fields: ['user_id'] },
            { fields: ['is_active'] }
        ]
    }
);

module.exports = ReportSchedule;
