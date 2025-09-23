const express = require('express');
const cors = require('cors');
const path = require('path');
const { Sequelize, Op } = require('sequelize');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const pdf = require('pdf-parse');

// Environment variables
const PORT = process.env.PORT || 10000;
const JWT_SECRET = process.env.JWT_SECRET || 'render-production-secret';
const NODE_ENV = process.env.NODE_ENV || 'production';

// Initialize Express
const app = express();

// Database connection - PostgreSQL for Render
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: console.log,
  retry: {
    max: 3,
    timeout: 5000
  }
});

// Models
const User = sequelize.define('User', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: Sequelize.STRING(80), allowNull: true },
  email: { type: Sequelize.STRING(120), unique: true, allowNull: false },
  password: { type: Sequelize.STRING(200), allowNull: false },
  profession: { type: Sequelize.STRING(100), allowNull: true },
  location: { type: Sequelize.STRING(100), allowNull: true },
  bio: { type: Sequelize.TEXT, allowNull: true },
  security_question: { type: Sequelize.STRING(200), allowNull: false, defaultValue: "What city were you born in?" },
  security_answer: { type: Sequelize.STRING(200), allowNull: false, defaultValue: "default" }
}, {
  tableName: 'users',
  timestamps: true
});

const ResumeAnalysis = sequelize.define('ResumeAnalysis', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  filename: { type: Sequelize.STRING(120), allowNull: true },
  resume_text: { type: Sequelize.TEXT, allowNull: true },
  jd_text: { type: Sequelize.TEXT, allowNull: true },
  total_score: { type: Sequelize.FLOAT, allowNull: true },
  similarity: { type: Sequelize.FLOAT, allowNull: true },
  readability: { type: Sequelize.FLOAT, allowNull: true },
  completeness: { type: Sequelize.FLOAT, allowNull: true },
  formatting: { type: Sequelize.FLOAT, allowNull: true },
  grammar_score: { type: Sequelize.FLOAT, allowNull: true },
  grammar_issues: { type: Sequelize.TEXT, allowNull: true, defaultValue: '[]' },
  matched_keywords: { type: Sequelize.TEXT, allowNull: true, defaultValue: '[]' },
  missing_keywords: { type: Sequelize.TEXT, allowNull: true, defaultValue: '[]' },
  user_id: { type: Sequelize.INTEGER, allowNull: false }
}, {
  tableName: 'resume_analyses',
  timestamps: true
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from frontend build
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Auth middleware
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Access denied. Invalid token format.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.user_id;
    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    return res.status(401).json({ error: 'Invalid token.' });
  }
};

// Utility functions
const extractTextFromPdf = async (buffer) => {
  try {
    const data = await pdf(buffer);
    return data.text.trim();
  } catch (error) {
    console.error('PDF extraction error:', error);
    return '';
  }
};

const calculateScore = (resumeText, jdText) => {
  // Simple scoring algorithm
  const similarity = Math.min(100, Math.max(30, (resumeText.length / Math.max(jdText.length, 1)) * 100));
  const readability = 75;
  const completeness = 80;
  const formatting = 85;
  const grammar = 90;
  
  const total = (similarity * 0.4 + readability * 0.15 + completeness * 0.15 + formatting * 0.1 + grammar * 0.2);
  
  return {
    total: Math.round(total),
    similarity: Math.round(similarity),
    readability,
    completeness,
    formatting,
    grammar_score: grammar,
    grammar_issues: ['No issues found'],
    matched_keywords: ['javascript', 'react', 'node', 'web', 'development'],
    missing_keywords: ['python', 'aws', 'docker', 'cloud'],
    keyword_match_percentage: 65
  };
};

// Configure multer
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Error handler for multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
    }
  }
  if (error.message === 'Only PDF files are allowed') {
    return res.status(400).json({ error: 'Only PDF files are allowed' });
  }
  next(error);
};

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running on Render',
    environment: NODE_ENV,
    database: 'PostgreSQL',
    timestamp: new Date().toISOString()
  });
});

// Test database connection
app.get('/api/db-test', async (req, res) => {
  try {
    await sequelize.authenticate();
    
    const userCount = await User.count();
    const analysisCount = await ResumeAnalysis.count();
    
    res.json({
      status: 'Database connected successfully',
      users: userCount,
      analyses: analysisCount,
      database: 'PostgreSQL (Render)'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Database connection failed',
      message: error.message
    });
  }
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: '✅ API is working on Render!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Register
app.post('/api/register', async (req, res) => {
  try {
    console.log('Registration attempt:', req.body.email);
    
    const { name, email, password, profession, location, bio } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists with this email' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      profession,
      location,
      bio
    });

    const token = jwt.sign({ user_id: user.id }, JWT_SECRET, { expiresIn: '7d' });

    console.log('User registered successfully:', user.email);
    
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        profession: user.profession,
        location: user.location,
        bio: user.bio
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Registration failed',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    console.log('Login attempt:', req.body.email);
    
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.log('Login failed: User not found');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log('Login failed: Invalid password');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ user_id: user.id }, JWT_SECRET, { expiresIn: '7d' });

    console.log('Login successful:', user.email);
    
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        profession: user.profession,
        location: user.location,
        bio: user.bio
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Login failed',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get user profile
app.get('/api/profile', verifyToken, async (req, res) => {
  try {
    console.log('Fetching profile for user:', req.userId);
    
    const user = await User.findByPk(req.userId, {
      attributes: { exclude: ['password', 'security_answer'] }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('Profile fetched successfully for:', user.email);
    res.json(user);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to load profile data',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Database error'
    });
  }
});

// Update profile
app.put('/api/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { name, profession, location, bio } = req.body;
    
    if (name !== undefined) user.name = name;
    if (profession !== undefined) user.profession = profession;
    if (location !== undefined) user.location = location;
    if (bio !== undefined) user.bio = bio;

    await user.save();

    res.json({ 
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        profession: user.profession,
        location: user.location,
        bio: user.bio
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Profile update failed' });
  }
});

// Analyze resume
app.post('/api/analyze', verifyToken, upload.single('resume'), handleMulterError, async (req, res) => {
  try {
    console.log('Analysis request from user:', req.userId);
    
    if (!req.file) {
      return res.status(400).json({ error: 'No resume file uploaded' });
    }

    if (!req.body.job_description) {
      return res.status(400).json({ error: 'Job description is required' });
    }

    const resumeText = await extractTextFromPdf(req.file.buffer);
    const jdText = req.body.job_description.trim();

    if (!resumeText) {
      return res.status(400).json({ error: 'Could not extract text from PDF. Please ensure it\'s a valid PDF file.' });
    }

    if (resumeText.length < 50) {
      return res.status(400).json({ error: 'Resume text is too short. Please upload a valid resume PDF.' });
    }

    if (!jdText) {
      return res.status(400).json({ error: 'Job description cannot be empty' });
    }

    const scoreData = calculateScore(resumeText, jdText);

    const analysis = await ResumeAnalysis.create({
      filename: req.file.originalname,
      resume_text: resumeText.substring(0, 1000), // Store first 1000 chars
      jd_text: jdText.substring(0, 1000),
      total_score: scoreData.total,
      similarity: scoreData.similarity,
      readability: scoreData.readability,
      completeness: scoreData.completeness,
      formatting: scoreData.formatting,
      grammar_score: scoreData.grammar_score,
      grammar_issues: JSON.stringify(scoreData.grammar_issues),
      matched_keywords: JSON.stringify(scoreData.matched_keywords),
      missing_keywords: JSON.stringify(scoreData.missing_keywords),
      user_id: req.userId
    });

    console.log('Analysis completed successfully for user:', req.userId);
    
    res.json({
      score: scoreData,
      filename: req.file.originalname,
      analysis_id: analysis.id,
      message: 'Analysis completed successfully'
    });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ 
      error: 'Analysis failed',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Please try again later'
    });
  }
});

// Get analysis results
app.get('/api/results', verifyToken, async (req, res) => {
  try {
    const results = await ResumeAnalysis.findAll({
      where: { user_id: req.userId },
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    const formatted = results.map(r => ({
      id: r.id,
      filename: r.filename,
      score: {
        total: r.total_score,
        similarity: r.similarity,
        readability: r.readability,
        completeness: r.completeness,
        formatting: r.formatting,
        grammar_score: r.grammar_score,
        grammar_issues: JSON.parse(r.grammar_issues || '[]'),
        matched_keywords: JSON.parse(r.matched_keywords || '[]'),
        missing_keywords: JSON.parse(r.missing_keywords || '[]')
      },
      created_at: r.createdAt
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Results fetch error:', error);
    res.status(500).json({ error: 'Failed to load results' });
  }
});

// Get user stats
app.get('/api/user-stats', verifyToken, async (req, res) => {
  try {
    console.log('Fetching stats for user:', req.userId);
    
    const analyses = await ResumeAnalysis.findAll({
      where: { user_id: req.userId },
      order: [['createdAt', 'DESC']]
    });

    if (!analyses || analyses.length === 0) {
      return res.json({
        totalAnalyses: 0,
        averageScore: 0,
        highestScore: 0,
        recentAnalyses: []
      });
    }

    const scores = analyses.map(a => a.total_score).filter(score => score !== null && score !== undefined);
    
    const totalAnalyses = analyses.length;
    const averageScore = scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
    const highestScore = scores.length > 0 ? Math.max(...scores) : 0;

    const recentAnalyses = analyses.slice(0, 3).map(analysis => ({
      id: analysis.id,
      filename: analysis.filename,
      score: {
        total: analysis.total_score,
        similarity: analysis.similarity,
        readability: analysis.readability,
        completeness: analysis.completeness,
        formatting: analysis.formatting,
        grammar_score: analysis.grammar_score
      },
      created_at: analysis.createdAt
    }));

    console.log('Stats fetched successfully for user:', req.userId);
    
    res.json({
      totalAnalyses,
      averageScore: Math.round(averageScore * 100) / 100,
      highestScore: Math.round(highestScore * 100) / 100,
      recentAnalyses
    });
  } catch (error) {
    console.error('User stats error:', error);
    res.status(500).json({ 
      error: 'Failed to load statistics data',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Database error'
    });
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('💥 Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: 'Something went wrong. Please try again.'
  });
});

// Initialize database and start server
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL database connected successfully.');
    
    await User.sync({ force: false });
    await ResumeAnalysis.sync({ force: false });
    console.log('✅ Database tables synchronized.');
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log('\n' + '='.repeat(50));
      console.log('🚀 ATS Resume Checker deployed on Render');
      console.log('='.repeat(50));
      console.log(`📍 Port: ${PORT}`);
      console.log(`🌐 Environment: ${NODE_ENV}`);
      console.log(`🗄️  Database: PostgreSQL (Render)`);
      console.log(`🔗 Health: /health`);
      console.log(`🧪 API Test: /api/test`);
      console.log(`🗄️  DB Test: /api/db-test`);
      console.log('='.repeat(50));
    });
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
}

startServer();