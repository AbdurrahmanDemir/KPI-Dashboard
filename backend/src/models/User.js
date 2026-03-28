const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define(
    'User',
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: { notEmpty: true, len: [2, 100] },
        },
        email: {
            type: DataTypes.STRING(150),
            allowNull: false,
            unique: true,
            validate: { isEmail: true },
        },
        password_hash: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        role: {
            type: DataTypes.ENUM('admin', 'marketing_manager', 'viewer'),
            allowNull: false,
            defaultValue: 'viewer',
        },
        last_login: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
    },
    {
        tableName: 'users',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
);

// Şifre hash'leme hook
User.beforeCreate(async (user) => {
    if (user.password_hash) {
        user.password_hash = await bcrypt.hash(user.password_hash, 12);
    }
});

User.beforeUpdate(async (user) => {
    if (user.changed('password_hash')) {
        user.password_hash = await bcrypt.hash(user.password_hash, 12);
    }
});

// Şifre doğrulama instance metodu
User.prototype.validatePassword = async function (password) {
    return bcrypt.compare(password, this.password_hash);
};

// JSON'da şifreyi gizle
User.prototype.toJSON = function () {
    const values = { ...this.get() };
    delete values.password_hash;
    return values;
};

module.exports = User;
