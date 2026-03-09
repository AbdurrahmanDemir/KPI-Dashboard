const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SavedView = sequelize.define(
    'SavedView',
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
        layout_config: {
            type: DataTypes.JSON,
            allowNull: false,
            comment: 'Grafik konumları ve boyutları',
        },
        filter_config: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Kayıtlı filtre kombinasyonu',
        },
        is_default: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
    },
    {
        tableName: 'saved_views',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [{ fields: ['user_id'] }],
    }
);

module.exports = SavedView;
