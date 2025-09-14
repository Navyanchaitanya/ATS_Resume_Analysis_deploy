const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('📁 Created data directory:', dataDir);
}

// Database connection
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(dataDir, 'database.db'),
  logging: console.log
});

async function initializeDatabase() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Import models
    const User = require('./models/User');
    const ResumeAnalysis = require('./models/ResumeAnalysis');
    
    // Check if database exists and has tables
    const [tables] = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table'");
    const tableNames = tables.map(table => table.name);
    
    if (tableNames.includes('users') && tableNames.includes('resume_analyses')) {
      console.log('✅ Database already exists with tables. Using existing data.');
      await User.sync({ force: false });
      await ResumeAnalysis.sync({ force: false });
    } else {
      console.log('🆕 Creating new database tables...');
      await User.sync({ force: true });
      await ResumeAnalysis.sync({ force: true });
      console.log('✅ New database tables created.');
    }
    
    // Count records
    const [userCount] = await sequelize.query("SELECT COUNT(*) as count FROM users");
    const [analysisCount] = await sequelize.query("SELECT COUNT(*) as count FROM resume_analyses");
    
    console.log(`📊 Users: ${userCount[0].count}, Analyses: ${analysisCount[0].count}`);
    console.log('✅ Database initialization complete.');
    
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
  } finally {
    await sequelize.close();
  }
}

// Run initialization
initializeDatabase();