import { Sequelize } from 'sequelize';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrateDatabase() {
  let sequelize;

  console.log('🚀 Starting database migration...');
  
  if (process.env.DATABASE_URL) {
    // PostgreSQL
    sequelize = new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      protocol: 'postgres',
      dialectOptions: {
        ssl: process.env.NODE_ENV === 'production' ? {
          require: true,
          rejectUnauthorized: false
        } : false
      },
      logging: console.log
    });
    console.log('🔗 Connected to PostgreSQL');
  } else {
    // SQLite
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: path.join(dataDir, 'database.db'),
      logging: console.log
    });
    console.log('🔗 Connected to SQLite');
  }

  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established for migration.');

    // Import models using dynamic import
    const { default: User } = await import('../models/User.js');
    const { default: ResumeAnalysis } = await import('../models/ResumeAnalysis.js');

    // Sync with force: false to preserve data
    console.log('🔄 Syncing User table...');
    await User.sync({ force: false });
    
    console.log('🔄 Syncing ResumeAnalysis table...');
    await ResumeAnalysis.sync({ force: false });
    
    console.log('✅ Database migration completed successfully.');
    
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    throw error;
  } finally {
    await sequelize.close();
    console.log('🔒 Database connection closed.');
  }
}

// Run migration
migrateDatabase().catch(error => {
  console.error('💥 Migration failed:', error);
  process.exit(1);
});