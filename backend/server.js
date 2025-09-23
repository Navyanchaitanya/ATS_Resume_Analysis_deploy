const express = require('express');
const cors = require('cors');
const path = require('path');
const { Sequelize } = require('sequelize');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const pdf = require('pdf-parse');

// Environment variables
const PORT = process.env.PORT || 5000;
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
  logging: false
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

// Serve static files from frontend build (correct path for Render)
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Auth middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.user_id;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Utility functions
const extractTextFromPdf = async (buffer) => {
  try {
    const data = await pdf(buffer);
    return data.text.trim();
  } catch (error) {
    return '';
  }
};

const calculateScore = (resumeText, jdText) => {
  const similarity = Math.min(100, Math.max(30, resumeText.length / jdText.length * 100));
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
    grammar_issues: [],
    matched_keywords: ['javascript', 'react', 'node', 'api'],
    missing_keywords: ['python', 'aws', 'docker'],
    keyword_match_percentage: 65
  };
};

// Configure multer
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running on Render',
    environment: NODE_ENV,
    database: 'PostgreSQL'
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: '✅ API is working on Render!',
    timestamp: new Date().toISOString()
  });
});

// Register
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password, profession, location, bio } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      name, email, password: hashedPassword, profession, location, bio
    });

    const token = jwt.sign({ user_id: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: user.id, name: user.name, email: user.email, profession: user.profession }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ user_id: user.id }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, profession: user.profession }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Analyze resume
app.post('/api/analyze', verifyToken, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file || !req.body.job_description) {
      return res.status(400).json({ error: 'Resume and job description required' });
    }

    const resumeText = await extractTextFromPdf(req.file.buffer);
    const jdText = req.body.job_description.trim();

    if (!resumeText) {
      return res.status(400).json({ error: 'Could not extract text from PDF' });
    }

    const scoreData = calculateScore(resumeText, jdText);

    const analysis = await ResumeAnalysis.create({
      filename: req.file.originalname,
      resume_text: resumeText,
      jd_text: jdText,
      ...scoreData,
      user_id: req.userId
    });

    res.json({ score: scoreData, analysis_id: analysis.id });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

// Get user profile
app.get('/api/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, {
      attributes: { exclude: ['password'] }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Profile fetch failed' });
  }
});

// Get analysis results
app.get('/api/results', verifyToken, async (req, res) => {
  try {
    const results = await ResumeAnalysis.findAll({
      where: { user_id: req.userId },
      order: [['createdAt', 'DESC']]
    });
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Results fetch failed' });
  }
});

// Get user stats
app.get('/api/user-stats', verifyToken, async (req, res) => {
  try {
    const analyses = await ResumeAnalysis.findAll({
      where: { user_id: req.userId }
    });

    const stats = analyses.length > 0 ? {
      totalAnalyses: analyses.length,
      averageScore: analyses.reduce((sum, a) => sum + (a.total_score || 0), 0) / analyses.length,
      highestScore: Math.max(...analyses.map(a => a.total_score || 0)),
      recentAnalyses: analyses.slice(0, 3).map(a => ({
        id: a.id,
        filename: a.filename,
        score: { total: a.total_score }
      }))
    } : {
      totalAnalyses: 0,
      averageScore: 0,
      highestScore: 0,
      recentAnalyses: []
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Stats fetch failed' });
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Initialize database and start server
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL database connected successfully');
    
    await User.sync({ force: false });
    await ResumeAnalysis.sync({ force: false });
    console.log('✅ Database tables synchronized');
    
    app.listen(PORT, () => {
      console.log('\n' + '='.repeat(50));
      console.log('🚀 ATS Resume Checker deployed on Render');
      console.log('='.repeat(50));
      console.log(`📍 Port: ${PORT}`);
      console.log(`🌐 Environment: ${NODE_ENV}`);
      console.log(`🗄️  Database: PostgreSQL (Render)`);
      console.log('='.repeat(50));
    });
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
}

startServer();