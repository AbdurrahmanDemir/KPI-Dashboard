const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Segment = sequelize.define(
    'Segment',
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
        rules_config: {
            type: DataTypes.JSON,
            allowNull: false,
            comment: 'Segment kuralları (kanal, cihaz, ciro aralığı vb.)',
        },
    },
    {
        tableName: 'segments',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [{ fields: ['user_id'] }],
    }
);

module.exports = Segment;
