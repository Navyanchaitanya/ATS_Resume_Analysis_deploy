const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { Sequelize } = require('sequelize');
const authRoutes = require('./routes/auth');
const analyzeRoutes = require('./routes/analyze');
const userRoutes = require('./routes/user');

const app = express();
const PORT = process.env.PORT || 5000;

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('📁 Created data directory:', dataDir);
}

// Create backups directory if it doesn't exist
const backupsDir = path.join(__dirname, 'backups');
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
  console.log('📁 Created backups directory:', backupsDir);
}

// Database connection
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(dataDir, 'database.db'),
  logging: false
});

// Simple database backup function
function backupDatabase() {
  try {
    const source = path.join(__dirname, 'data', 'database.db');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const destination = path.join(backupsDir, `database-backup-${timestamp}.db`);
    
    if (fs.existsSync(source)) {
      fs.copyFileSync(source, destination);
      console.log(`✅ Database backed up to: ${path.basename(destination)}`);
    }
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
  }
}

// Test database connection and sync models
(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Import models
    const { User, ResumeAnalysis } = require('./models');
    
    // Sync models WITHOUT force: true (this preserves data)
    await User.sync({ force: false });
    await ResumeAnalysis.sync({ force: false });
    console.log('✅ Database tables synced. Data preserved.');
    
    // Backup database on startup
    backupDatabase();
    
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error.message);
  }
})();

// Middleware - Enhanced CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? false // Let Render handle it
    : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Pre-flight requests
app.options('*', cors());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
}

// Routes
app.use('/api', authRoutes);
app.use('/api', analyzeRoutes);
app.use('/api', userRoutes);

// Test endpoint - NO AUTH REQUIRED
app.get('/api/test', (req, res) => {
  res.json({ 
    message: '✅ API is working!',
    timestamp: new Date().toISOString(),
    database: 'SQLite',
    status: 'operational'
  });
});

// Health check endpoint - NO AUTH REQUIRED
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Database info endpoint - NO AUTH REQUIRED
app.get('/api/db-info', async (req, res) => {
  try {
    const [users] = await sequelize.query("SELECT COUNT(*) as count FROM users");
    const [analyses] = await sequelize.query("SELECT COUNT(*) as count FROM resume_analyses");
    
    res.json({
      database: 'SQLite',
      users: users[0].count,
      analyses: analyses[0].count,
      file: path.basename(sequelize.config.storage),
      size: fs.existsSync(sequelize.config.storage) 
        ? `${(fs.statSync(sequelize.config.storage).size / 1024 / 1024).toFixed(2)} MB` 
        : 'Not found'
    });
  } catch (error) {
    res.status(500).json({ error: 'Database info unavailable' });
  }
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
} else {
  // Basic route - NO AUTH REQUIRED (dev only)
  app.get('/', (req, res) => {
    res.json({ 
      message: '🚀 ATS Resume Checker backend is running',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      endpoints: {
        auth: '/api/login, /api/register, /api/profile',
        analyze: '/api/analyze, /api/results',
        user: '/api/user-stats, /api/stats',
        public: '/api/test, /health, /api/db-info'
      }
    });
  });
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('💥 Unhandled error:', error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({ error: 'Validation error', details: error.errors });
  }
  
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired' });
  }
  
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  if (process.env.NODE_ENV === 'production' && req.originalUrl.startsWith('/api')) {
    res.status(404).json({ 
      error: 'Endpoint not found',
      message: `The requested endpoint ${req.originalUrl} does not exist.`,
      availableEndpoints: {
        auth: ['POST /api/login', 'POST /api/register', 'GET /api/profile'],
        analyze: ['POST /api/analyze', 'GET /api/results', 'GET /api/user-stats'],
        public: ['GET /api/test', 'GET /health', 'GET /api/db-info']
      }
    });
  } else if (process.env.NODE_ENV === 'production') {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  } else {
    res.status(404).json({ 
      error: 'Endpoint not found',
      message: `The requested endpoint ${req.originalUrl} does not exist.`
    });
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server gracefully...');
  try {
    // Backup before shutting down
    backupDatabase();
    
    await sequelize.close();
    console.log('✅ Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

// Start server
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(50));
  console.log('🚀 ATS Resume Checker Server Started');
  console.log('='.repeat(50));
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  if (process.env.NODE_ENV === 'production') {
    console.log(`📦 Serving frontend from: ../frontend/dist`);
  } else {
    console.log(`🌐 Local: http://localhost:${PORT}`);
    console.log(`🩺 Health: http://localhost:${PORT}/health`);
    console.log(`🧪 Test API: http://localhost:${PORT}/api/test`);
    console.log(`🗄️  DB Info: http://localhost:${PORT}/api/db-info`);
  }
  console.log('='.repeat(50));
  console.log('💾 Database: SQLite (data/database.db)');
  console.log('📊 Data will persist across server restarts');
  console.log('='.repeat(50));
});

module.exports = app;