const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ChannelMapping = sequelize.define(
    'ChannelMapping',
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        source: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        medium: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        channel_group: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        platform: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        is_paid: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
    },
    {
        tableName: 'channel_mapping',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false,
        indexes: [
            { unique: true, fields: ['source', 'medium'], name: 'uq_source_medium' },
        ],
    }
);

module.exports = ChannelMapping;
