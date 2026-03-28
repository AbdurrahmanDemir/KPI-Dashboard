const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const RefreshToken = sequelize.define(
    'RefreshToken',
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
        token_hash: {
            type: DataTypes.STRING(128),
            allowNull: false,
            unique: true,
        },
        expires_at: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        revoked_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        last_used_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        tableName: 'refresh_tokens',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false,
        indexes: [
            { fields: ['user_id'] },
            { fields: ['expires_at'] },
            { fields: ['revoked_at'] }
        ]
    }
);

module.exports = RefreshToken;
