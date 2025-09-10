const express = require('express');
const cors = require('cors');
const path = require('path');
const { Sequelize } = require('sequelize');
const authRoutes = require('./routes/auth');
const analyzeRoutes = require('./routes/analyze');
const { User, ResumeAnalysis } = require('./models');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware - Enhanced CORS configuration
app.use(cors({
  origin: 'http://localhost:5173', // Your Vite frontend URL
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'data', 'database.db')
});

// Test database connection
(async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Sync models with database
    await User.sync({ force: false });
    await ResumeAnalysis.sync({ force: false });
    console.log('Database tables synced.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
})();

// Routes
app.use('/api', authRoutes);
app.use('/api', analyzeRoutes);

// Basic route
app.get('/', (req, res) => {
  res.send('✅ ATS Resume Checker backend is running');
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

module.exports = app;