// Replace the database connection section with:
const sequelize = new Sequelize(
  process.env.DATABASE_URL || // Render PostgreSQL URL
  {
    dialect: 'sqlite',
    storage: path.join(dataDir, 'database.db'),
    logging: NODE_ENV === 'development' ? console.log : false
  }
);

// Add this after database connection to handle PostgreSQL properly:
if (process.env.DATABASE_URL) {
  // PostgreSQL specific configuration
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    },
    logging: false
  });
}