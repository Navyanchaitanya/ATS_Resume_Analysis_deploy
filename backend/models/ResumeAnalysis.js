const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ResumeAnalysis = sequelize.define('ResumeAnalysis', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  filename: {
    type: DataTypes.STRING(120),
    allowNull: true
  },
  resume_text: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  jd_text: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  total_score: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  similarity: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  readability: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  completeness: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  formatting: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  grammar_score: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  grammar_issues: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  matched_keywords: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  missing_keywords: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'resume_analyses',
  timestamps: false
});

module.exports = ResumeAnalysis;