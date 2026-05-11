const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ImportStagingRow = sequelize.define(
    'ImportStagingRow',
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
        target_table: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        normalized_payload: {
            type: DataTypes.JSON,
            allowNull: false,
        },
        staging_status: {
            type: DataTypes.ENUM('validated', 'error', 'committed'),
            allowNull: false,
            defaultValue: 'validated',
        },
        validation_errors: {
            type: DataTypes.JSON,
            allowNull: true,
        },
    },
    {
        tableName: 'import_staging_rows',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false,
        indexes: [
            { fields: ['import_id'] },
            { fields: ['source_type'] },
            { fields: ['target_table'] },
            { fields: ['staging_status'] },
            { fields: ['row_number'] },
        ],
    }
);

module.exports = ImportStagingRow;
