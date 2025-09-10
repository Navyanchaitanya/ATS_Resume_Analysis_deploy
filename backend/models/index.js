const sequelize = require('../config/database');
const User = require('./User');
const ResumeAnalysis = require('./ResumeAnalysis');

// Define associations
User.hasMany(ResumeAnalysis, { foreignKey: 'user_id' });
ResumeAnalysis.belongsTo(User, { foreignKey: 'user_id' });

module.exports = {
  sequelize,
  User,
  ResumeAnalysis
};