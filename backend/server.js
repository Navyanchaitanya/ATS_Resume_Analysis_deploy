// server.js - Combined production server
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { Sequelize } = require('sequelize');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const pdf = require('pdf-parse');
const natural = require('natural');
const cosineSimilarity = require('cosine-similarity');

// Environment variables
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-production';
const NODE_ENV = process.env.NODE_ENV || 'production';

// Initialize Express
const app = express();

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Database connection
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(dataDir, 'database.db'),
  logging: NODE_ENV === 'development' ? console.log : false
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
  security_question: { type: Sequelize.STRING(200), allowNull: false },
  security_answer: { type: Sequelize.STRING(200), allowNull: false },
  reset_token: { type: Sequelize.STRING(200), allowNull: true },
  reset_token_expiry: { type: Sequelize.DATE, allowNull: true }
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
  keyword_match_percentage: { type: Sequelize.FLOAT, allowNull: true },
  user_id: { 
    type: Sequelize.INTEGER, 
    allowNull: false,
    references: { model: 'users', key: 'id' }
  }
}, {
  tableName: 'resume_analyses',
  timestamps: true
});

// Middleware
app.use(cors({
  origin: NODE_ENV === 'development' 
    ? ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174']
    : true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'dist')));

// Auth middleware
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.user_id;
    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired.' });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token.' });
    } else {
      return res.status(400).json({ error: 'Token verification failed.' });
    }
  }
};

// Utility functions
const extractTextFromPdf = async (buffer) => {
  try {
    const data = await pdf(buffer);
    return data.text.trim();
  } catch (error) {
    console.error('Error reading PDF:', error);
    return '';
  }
};

// Scoring functions (simplified versions from your scorer.js)
const tfidfSimilarityScore = (resumeText, jdText) => {
  try {
    const tfidf = new natural.TfIdf();
    tfidf.addDocument(resumeText.toLowerCase());
    tfidf.addDocument(jdText.toLowerCase());
    
    const resumeVector = [];
    const jdVector = [];
    
    tfidf.listTerms(0).forEach(item => { resumeVector[item.term] = item.tfidf; });
    tfidf.listTerms(1).forEach(item => { jdVector[item.term] = item.tfidf; });
    
    const allTerms = new Set([...Object.keys(resumeVector), ...Object.keys(jdVector)]);
    const resumeVecArray = [];
    const jdVecArray = [];
    
    allTerms.forEach(term => {
      resumeVecArray.push(resumeVector[term] || 0);
      jdVecArray.push(jdVector[term] || 0);
    });
    
    const score = cosineSimilarity(resumeVecArray, jdVecArray);
    return Math.max(0, Math.round(score * 100 * 100) / 100);
  } catch (error) {
    console.error('Similarity calculation error:', error);
    return 0.0;
  }
};

const formattingScore = (resumeText) => {
  const lines = resumeText.split('\n');
  const hasBulletPoints = lines.some(line => line.trim().match(/^[•\-*]\s/));
  const hasHeadings = lines.some(line => line.trim().match(/^[A-Z][A-Z\s]+:$/));
  const hasDates = resumeText.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}\b|\b\d{4}\s*[-–]\s*\d{4}\b/);
  
  let score = 60;
  if (hasBulletPoints) score += 10;
  if (hasHeadings) score += 10;
  if (hasDates) score += 10;
  if (resumeText.length > 300) score += 10;
  
  return Math.min(100, score);
};

const readabilityScore = (resumeText) => {
  const sentences = resumeText.split(/[.!?]/).filter(s => s.trim().length > 0);
  const words = resumeText.split(/\s+/).filter(w => w.length > 0);
  
  if (sentences.length === 0) return 50;
  
  const avgWordsPerSentence = words.length / sentences.length;
  const longSentences = sentences.filter(s => s.split(/\s+/).length > 25).length;
  const sentenceRatio = (longSentences / sentences.length) * 100;
  
  let score = Math.max(30, Math.min(100, 100 - Math.abs(avgWordsPerSentence - 18) * 3));
  if (sentenceRatio > 30) score -= 15;
  
  return Math.round(score);
};

const completenessScore = (resumeText) => {
  const REQUIRED_SECTIONS = ["education", "experience", "skills", "projects", "certifications", "summary"];
  const lowerText = resumeText.toLowerCase();
  const found = REQUIRED_SECTIONS.filter(section => {
    const regex = new RegExp(`\\b${section}\\b|${section}s?\\s*:`, 'i');
    return regex.test(lowerText);
  });
  
  return Math.round((found.length / REQUIRED_SECTIONS.length) * 100 * 100) / 100;
};

const grammarScore = (resumeText) => {
  // Simplified grammar check
  let score = 85;
  const issues = [];
  
  // Basic checks
  if (resumeText.length < 100) {
    score -= 10;
    issues.push("Resume seems too short");
  }
  
  if (resumeText.split('.').length < 3) {
    score -= 5;
    issues.push("Consider using more complete sentences");
  }
  
  return { score: Math.max(0, score), issues };
};

const extractKeywords = (text, topN = 25) => {
  const tokenizer = new natural.WordTokenizer();
  const tokens = tokenizer.tokenize(text.toLowerCase());
  const stopWords = new Set(['the', 'and', 'is', 'in', 'to', 'of', 'for', 'with', 'on', 'at', 'by']);
  
  const freq = {};
  tokens.forEach(token => {
    const cleanToken = token.replace(/[^\w]/g, '');
    if (cleanToken.length >= 4 && !stopWords.has(cleanToken) && !/\d/.test(cleanToken)) {
      freq[cleanToken] = (freq[cleanToken] || 0) + 1;
    }
  });
  
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(entry => entry[0]);
};

const overallScore = async (resumeText, jdText) => {
  const sim = tfidfSimilarityScore(resumeText, jdText);
  const read = readabilityScore(resumeText);
  const comp = completenessScore(resumeText);
  const fmt = formattingScore(resumeText);
  const { score: gram, issues: grammar_issues } = grammarScore(resumeText);

  const total = Math.round((sim * 0.35 + read * 0.15 + comp * 0.15 + fmt * 0.10 + gram * 0.25) * 100) / 100;

  const keywordsFromJd = extractKeywords(jdText, 30);
  const resumeKeywords = extractKeywords(resumeText, 50);
  
  const keywordsInResume = keywordsFromJd.filter(kw => 
    resumeKeywords.includes(kw) || resumeText.toLowerCase().includes(kw)
  );
  
  const missingKeywords = keywordsFromJd.filter(kw => !keywordsInResume.includes(kw));

  return {
    total: Math.min(100, total),
    similarity: sim,
    readability: read,
    completeness: comp,
    formatting: fmt,
    grammar_score: gram,
    grammar_issues,
    matched_keywords: keywordsInResume.slice(0, 20),
    missing_keywords: missingKeywords.slice(0, 15),
    keyword_match_percentage: Math.round((keywordsInResume.length / Math.max(1, keywordsFromJd.length)) * 100)
  };
};

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Routes
// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Register
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password, profession, location, bio, security_question, security_answer } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    if (!security_question || !security_answer) {
      return res.status(400).json({ error: 'Security question and answer are required' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists with this email' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const hashedSecurityAnswer = await bcrypt.hash(security_answer.toLowerCase().trim(), 12);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      profession,
      location,
      bio,
      security_question,
      security_answer: hashedSecurityAnswer
    });

    const token = jwt.sign({ user_id: newUser.id }, JWT_SECRET, { expiresIn: '7d' });

    return res.status(201).json({
      message: 'User registered successfully.',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        profession: newUser.profession,
        location: newUser.location,
        bio: newUser.bio
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ user_id: user.id }, JWT_SECRET, { expiresIn: '7d' });

    return res.json({
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
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Profile
app.get('/api/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, {
      attributes: { exclude: ['password', 'security_answer', 'reset_token'] }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json(user);
  } catch (error) {
    console.error('Profile fetch error:', error);
    return res.status(500).json({ error: 'Internal server error' });
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

    return res.json({ 
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
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Analyze resume
app.post('/api/analyze', verifyToken, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No resume file uploaded' });
    }

    if (!req.body.job_description) {
      return res.status(400).json({ error: 'Job description is required' });
    }

    const resumeFile = req.file;
    const jobDescription = req.body.job_description;

    // Extract text from PDF
    const resumeText = await extractTextFromPdf(resumeFile.buffer);
    const jdText = jobDescription.trim();

    if (!resumeText) {
      return res.status(400).json({ error: 'Could not extract text from PDF' });
    }

    if (!jdText) {
      return res.status(400).json({ error: 'Job description cannot be empty' });
    }

    // Calculate score
    const scoreData = await overallScore(resumeText, jdText);

    // Save to database
    const analysis = await ResumeAnalysis.create({
      filename: resumeFile.originalname,
      resume_text: resumeText,
      jd_text: jdText,
      total_score: scoreData.total || 0,
      similarity: scoreData.similarity,
      readability: scoreData.readability,
      completeness: scoreData.completeness,
      formatting: scoreData.formatting,
      grammar_score: scoreData.grammar_score || 0,
      grammar_issues: JSON.stringify(scoreData.grammar_issues || []),
      matched_keywords: JSON.stringify(scoreData.matched_keywords || []),
      missing_keywords: JSON.stringify(scoreData.missing_keywords || []),
      keyword_match_percentage: scoreData.keyword_match_percentage || 0,
      user_id: req.userId
    });

    return res.json({
      score: scoreData,
      filename: resumeFile.originalname,
      analysis_id: analysis.id
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
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
        missing_keywords: JSON.parse(r.missing_keywords || '[]'),
        keyword_match_percentage: r.keyword_match_percentage
      },
      created_at: r.createdAt
    }));

    return res.json(formatted);
  } catch (error) {
    console.error('Results fetch error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user stats
app.get('/api/user-stats', verifyToken, async (req, res) => {
  try {
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

    const recentAnalyses = analyses.slice(0, 5).map(analysis => ({
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

    return res.json({
      totalAnalyses,
      averageScore,
      highestScore,
      recentAnalyses
    });
  } catch (error) {
    console.error('User stats error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Initialize database and start server
async function initializeServer() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Sync models
    await User.sync({ force: false });
    await ResumeAnalysis.sync({ force: false });
    console.log('✅ Database tables synced.');
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 Open http://localhost:${PORT} to view the app`);
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
}

initializeServer();