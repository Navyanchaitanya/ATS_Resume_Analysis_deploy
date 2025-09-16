const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(80),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(120),
    unique: true,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  profession: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  location: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  security_question: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  security_answer: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  reset_token: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  reset_token_expiry: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: true
});

module.exports = User;