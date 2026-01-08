import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

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
  // Add these fields to your existing User model:
is_admin: {
  type: Sequelize.BOOLEAN,
  defaultValue: false,
  allowNull: false
},
admin_role: {
  type: Sequelize.STRING,
  defaultValue: 'user'
},
  email: {
    type: DataTypes.STRING(120),
    unique: true,
    allowNull: false,
    validate: {
      isEmail: true
    }
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
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  verification_token: {
    type: DataTypes.STRING(200),
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: true
});

export default User;