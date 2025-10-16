// models/Resume.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Resume = sequelize.define('Resume', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(120),
    allowNull: false
  },
  template: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  data: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  preview: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'resumes',
  timestamps: true
});

module.exports = Resume;