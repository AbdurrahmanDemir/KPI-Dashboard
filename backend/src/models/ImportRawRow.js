const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ImportRawRow = sequelize.define(
    'ImportRawRow',
    {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        import_id: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
        },
        row_number: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
        },
        source_type: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        raw_payload: {
            type: DataTypes.JSON,
            allowNull: false,
        },
        validation_status: {
            type: DataTypes.ENUM('pending', 'valid', 'error', 'committed'),
            allowNull: false,
            defaultValue: 'pending',
        },
        validation_errors: {
            type: DataTypes.JSON,
            allowNull: true,
        },
    },
    {
        tableName: 'import_raw_rows',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false,
        indexes: [
            { fields: ['import_id'] },
            { fields: ['source_type'] },
            { fields: ['validation_status'] },
            { fields: ['row_number'] },
        ],
    }
);

module.exports = ImportRawRow;
