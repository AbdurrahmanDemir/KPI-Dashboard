const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Integration = sequelize.define('Integration', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    platform: { type: DataTypes.STRING, allowNull: false, unique: true }, // 'google_ads', 'meta_ads'
    client_id: { type: DataTypes.STRING, allowNull: true },
    client_secret: { type: DataTypes.STRING, allowNull: true },
    developer_token: { type: DataTypes.STRING, allowNull: true },
    account_id: { type: DataTypes.STRING, allowNull: true },
    access_token: { type: DataTypes.TEXT, allowNull: true },
    refresh_token: { type: DataTypes.TEXT, allowNull: true },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    last_sync_at: { type: DataTypes.DATE, allowNull: true }
}, {
    tableName: 'integrations',
    timestamps: true,
    underscored: true
});

module.exports = Integration;
