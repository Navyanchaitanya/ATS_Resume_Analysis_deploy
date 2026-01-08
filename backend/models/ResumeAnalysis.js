import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

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
    allowNull: true,
    defaultValue: '[]'
  },
  matched_keywords: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: '[]'
  },
  missing_keywords: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: '[]'
  },
  keyword_match_percentage: {
    type: DataTypes.FLOAT,
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
  tableName: 'resume_analyses',
  timestamps: true
});

export default ResumeAnalysis;