const { Sequelize } = require('sequelize');

async function initializeDatabase() {
  const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: console.log
  });

  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connection established successfully.');
    
    // Test query to ensure database is working
    const [result] = await sequelize.query("SELECT version()");
    console.log('📊 PostgreSQL version:', result[0].version);
    
    console.log('✅ Database initialization completed');
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

initializeDatabase().catch(console.error);