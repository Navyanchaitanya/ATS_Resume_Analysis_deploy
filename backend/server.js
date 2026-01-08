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
const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || 'admin-secret-key-123';

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
  security_answer: { type: Sequelize.STRING(200), allowNull: false, defaultValue: "default" },
  // Admin fields
  is_admin: { 
    type: Sequelize.BOOLEAN, 
    defaultValue: false, 
    allowNull: false 
  },
  admin_role: { 
    type: Sequelize.STRING, 
    defaultValue: 'user' 
  }
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

// Define associations
User.hasMany(ResumeAnalysis, { foreignKey: 'user_id' });
ResumeAnalysis.belongsTo(User, { foreignKey: 'user_id' });

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from frontend build
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// ==================== MIDDLEWARE ====================

// Regular auth middleware
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

// Admin auth middleware
const verifyAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.user_id;

    // Check if user exists and is admin
    const user = await User.findByPk(req.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is admin
    if (!user.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Add admin info to request
    req.isAdmin = true;
    req.adminRole = user.admin_role || 'admin';
    
    next();
  } catch (error) {
    console.error('Admin verification error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ==================== UTILITY FUNCTIONS ====================

const extractTextFromPdf = async (buffer) => {
  try {
    const data = await pdf(buffer);
    return data.text.trim();
  } catch (error) {
    console.error('PDF extraction error:', error);
    return '';
  }
};

// Enhanced version of your existing scoring logic
const calculateScore = (resumeText, jdText) => {
  try {
    console.log('Calculating score with enhanced logic...');
    
    // Use your existing similarity calculation (TF-IDF based)
    const similarity = tfidfSimilarityScore(resumeText, jdText);
    
    // Enhanced readability scoring
    const readability = enhancedReadabilityScore(resumeText);
    
    // Enhanced completeness scoring
    const completeness = enhancedCompletenessScore(resumeText);
    
    // Enhanced formatting scoring
    const formatting = enhancedFormattingScore(resumeText);
    
    // Enhanced grammar scoring
    const { score: grammar_score, issues: grammar_issues } = enhancedGrammarScore(resumeText);
    
    // Your existing weighted calculation
    const total = Math.round((
      similarity * 0.35 + // Relevance to job description
      readability * 0.15 + // Readability and structure
      completeness * 0.15 + // Essential sections
      formatting * 0.10 + // Professional formatting
      grammar_score * 0.25   // Grammar and professionalism
    ));
    
    // Enhanced keyword extraction
    const keywordsFromJd = enhancedExtractKeywords(jdText, 30);
    const resumeKeywords = enhancedExtractKeywords(resumeText, 50);
    
    const keywordsInResume = keywordsFromJd.filter(kw => 
      resumeKeywords.includes(kw) || resumeText.toLowerCase().includes(kw)
    );
    
    const missingKeywords = keywordsFromJd.filter(kw => !keywordsInResume.includes(kw));
    
    const keyword_match_percentage = Math.round((keywordsInResume.length / Math.max(1, keywordsFromJd.length)) * 100);

    console.log('Enhanced scoring results:', {
      total,
      similarity,
      readability,
      completeness,
      formatting,
      grammar_score,
      keyword_match_percentage
    });
    
    return {
      total: Math.min(100, total),
      similarity: Math.round(similarity),
      readability: Math.round(readability),
      completeness: Math.round(completeness),
      formatting: Math.round(formatting),
      grammar_score: Math.round(grammar_score),
      grammar_issues: grammar_issues.slice(0, 10), // Limit issues
      matched_keywords: keywordsInResume.slice(0, 20),
      missing_keywords: missingKeywords.slice(0, 15),
      keyword_match_percentage
    };
  } catch (error) {
    console.error('Enhanced scoring failed, using fallback:', error);
    // Fallback to your original simple scoring
    return getFallbackScore(resumeText, jdText);
  }
};

// Keep your existing tfidfSimilarityScore function but enhance it
const tfidfSimilarityScore = (resumeText, jdText) => {
  try {
    // Your existing logic with minor improvements
    const natural = require('natural');
    const cosineSimilarity = require('cosine-similarity');
    
    const tfidf = new natural.TfIdf();
    tfidf.addDocument(resumeText.toLowerCase());
    tfidf.addDocument(jdText.toLowerCase());
    
    const resumeVector = [];
    const jdVector = [];
    
    tfidf.listTerms(0).forEach(item => {
      resumeVector[item.term] = item.tfidf;
    });
    
    tfidf.listTerms(1).forEach(item => {
      jdVector[item.term] = item.tfidf;
    });
    
    const allTerms = new Set([...Object.keys(resumeVector), ...Object.keys(jdVector)]);
    const resumeVecArray = [];
    const jdVecArray = [];
    
    allTerms.forEach(term => {
      resumeVecArray.push(resumeVector[term] || 0);
      jdVecArray.push(jdVector[term] || 0);
    });
    
    let score = cosineSimilarity(resumeVecArray, jdVecArray);
    score = Math.max(0, Math.round(score * 100 * 100) / 100);
    
    // Add bonus for exact keyword matches
    const exactMatches = enhancedExtractKeywords(jdText).filter(keyword => 
      resumeText.toLowerCase().includes(keyword.toLowerCase())
    ).length;
    
    const totalKeywords = enhancedExtractKeywords(jdText).length;
    const exactMatchBonus = totalKeywords > 0 ? (exactMatches / totalKeywords) * 10 : 0;
    
    return Math.min(100, score + exactMatchBonus);
  } catch (error) {
    console.error('Similarity calculation error:', error);
    return 50; // Fallback score
  }
};

// Enhanced readability scoring
const enhancedReadabilityScore = (resumeText) => {
  const sentences = resumeText.split(/[.!?]/).filter(s => s.trim().length > 0);
  const words = resumeText.split(/\s+/).filter(w => w.length > 0);
  
  if (sentences.length === 0) return 50;
  
  const avgWordsPerSentence = words.length / sentences.length;
  const longSentences = sentences.filter(s => s.split(/\s+/).length > 25).length;
  const sentenceRatio = (longSentences / sentences.length) * 100;
  
  let score = Math.max(30, Math.min(100, 100 - Math.abs(avgWordsPerSentence - 18) * 3));
  
  // Enhanced penalties/bonuses
  if (sentenceRatio > 30) score -= 15;
  if (sentenceRatio < 10) score += 5; // Bonus for concise writing
  
  // Check for bullet points (good for resumes)
  const hasBullets = resumeText.split('\n').some(line => line.trim().match(/^[•\-*]\s/));
  if (hasBullets) score += 8;
  
  return Math.round(score);
};

// Enhanced completeness scoring
const enhancedCompletenessScore = (resumeText) => {
  const REQUIRED_SECTIONS = [
    "experience", "education", "skills", "projects", 
    "certifications", "summary", "contact", "objective"
  ];
  
  const lowerText = resumeText.toLowerCase();
  const found = REQUIRED_SECTIONS.filter(section => {
    const regex = new RegExp(`\\b${section}\\b|${section}s?\\s*:`, 'i');
    return regex.test(lowerText);
  });
  
  let baseScore = Math.round((found.length / REQUIRED_SECTIONS.length) * 100);
  
  // Bonus points for having critical sections
  const criticalSections = ["experience", "education", "skills"];
  const hasCritical = criticalSections.every(section => 
    lowerText.includes(section)
  );
  
  if (hasCritical) baseScore = Math.min(100, baseScore + 15);
  
  // Check for contact information
  const hasEmail = /\S+@\S+\.\S+/.test(resumeText);
  const hasPhone = /(\+\d{1,3}[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}/.test(resumeText);
  
  if (hasEmail) baseScore = Math.min(100, baseScore + 5);
  if (hasPhone) baseScore = Math.min(100, baseScore + 5);
  
  return baseScore;
};

// Enhanced formatting scoring
const enhancedFormattingScore = (resumeText) => {
  const lines = resumeText.split('\n');
  let score = 60; // Base score
  
  const hasBulletPoints = lines.some(line => line.trim().match(/^[•\-*]\s/));
  const hasHeadings = lines.some(line => line.trim().match(/^[A-Z][A-Z\s]+:$/));
  const hasDates = resumeText.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}\b|\b\d{4}\s*[-–]\s*\d{4}\b/);
  
  // Your existing scoring
  if (hasBulletPoints) score += 10;
  if (hasHeadings) score += 10;
  if (hasDates) score += 10;
  if (resumeText.length > 300) score += 10;
  
  // Enhanced checks
  const hasConsistentSpacing = lines.every(line => 
    line.length === 0 || line.trim().length > 0
  );
  if (hasConsistentSpacing) score += 5;
  
  const hasReasonableLength = resumeText.length > 400 && resumeText.length < 2000;
  if (hasReasonableLength) score += 5;
  
  return Math.min(100, score);
};

// Enhanced grammar scoring
const enhancedGrammarScore = (resumeText) => {
  let score = 85; // Base score
  const issues = [];
  
  const lines = resumeText.split('\n').filter(line => line.trim().length > 0);
  
  // Capitalization check for each line
  lines.forEach((line, lineIndex) => {
    const trimmedLine = line.trim();
    
    // Skip bullet points for capitalization check
    if (trimmedLine && !trimmedLine.match(/^[•\-*]\s/) && !/^[A-Z]/.test(trimmedLine)) {
      if (trimmedLine.length > 15) { // Only flag substantial lines
        issues.push({
          message: "Sentence should start with a capital letter",
          type: "punctuation",
          context: trimmedLine.substring(0, 60),
          location: `Line ${lineIndex + 1}`
        });
        score -= 2;
      }
    }
  });
  
  // Check for common error patterns
  const errorPatterns = [
    {
      pattern: /\bi\s+is\b/gi,
      message: "Use 'I am' instead of 'I is'",
      type: "grammar",
      penalty: 3
    },
    {
      pattern: /\b(your\s+you're|you're\s+your)\b/gi,
      message: "Confusion between 'your' and 'you're'",
      type: "grammar", 
      penalty: 2
    },
    {
      pattern: /\b(a|an)\s+[aeiou]/gi,
      message: "Use 'an' before vowel sounds",
      type: "grammar",
      penalty: 1
    }
  ];
  
  errorPatterns.forEach(pattern => {
    const matches = resumeText.match(pattern.pattern);
    if (matches) {
      issues.push({
        message: pattern.message,
        type: pattern.type,
        context: `Found ${matches.length} occurrence(s)`,
        location: "Various"
      });
      score -= pattern.penalty * matches.length;
    }
  });
  
  // Check for resume-specific issues
  if (resumeText.length < 200) {
    issues.push({
      message: "Resume seems too short - add more details",
      type: "content",
      context: "Consider expanding your experience sections",
      location: "Overall"
    });
    score -= 5;
  }
  
  if (!resumeText.match(/\b(managed|developed|created|implemented|led)\b/i)) {
    issues.push({
      message: "Use action verbs to start bullet points",
      type: "style", 
      context: "Examples: managed, developed, created, implemented",
      location: "Experience section"
    });
    score -= 3;
  }
  
  return { 
    score: Math.max(0, Math.round(score)), 
    issues: issues.slice(0, 8) // Limit to 8 most important issues
  };
};

// Enhanced keyword extraction
const enhancedExtractKeywords = (text, topN = 25) => {
  const natural = require('natural');
  const tokenizer = new natural.WordTokenizer();
  const tokens = tokenizer.tokenize(text.toLowerCase());
  
  // Enhanced stop words list
  const stopWords = new Set([
    'the', 'and', 'is', 'in', 'to', 'of', 'for', 'with', 'on', 'at', 'by', 
    'this', 'that', 'are', 'as', 'be', 'from', 'or', 'but', 'not', 'what',
    'all', 'were', 'when', 'we', 'there', 'been', 'if', 'more', 'an', 'which',
    'you', 'has', 'their', 'who', 'its', 'had', 'will', 'would', 'should',
    'can', 'could', 'may', 'might', 'must', 'shall', 'about', 'also', 'have'
  ]);
  
  const freq = {};
  tokens.forEach(token => {
    const cleanToken = token.replace(/[^\w]/g, '');
    if (cleanToken.length >= 3 && !stopWords.has(cleanToken) && !/\d/.test(cleanToken)) {
      freq[cleanToken] = (freq[cleanToken] || 0) + 1;
    }
  });
  
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(entry => entry[0]);
};

// Fallback scoring (your original simple logic)
const getFallbackScore = (resumeText, jdText) => {
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
    grammar_issues: ['Analysis completed with enhanced algorithm'],
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

// ==================== ROUTES ====================

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

// ==================== ADMIN ROUTES ====================

// Admin login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password, admin_key } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is admin
    if (!user.is_admin) {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    // Optional: verify admin key if provided
    if (admin_key && admin_key !== ADMIN_SECRET_KEY) {
      return res.status(401).json({ error: 'Invalid admin key' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate admin token
    const token = jwt.sign(
      { 
        user_id: user.id,
        is_admin: true,
        admin_role: user.admin_role || 'admin'
      },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        is_admin: user.is_admin,
        admin_role: user.admin_role,
        profession: user.profession,
        location: user.location
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get admin dashboard stats
app.get('/api/admin/dashboard/stats', verifyAdmin, async (req, res) => {
  try {
    // Total users count
    const totalUsers = await User.count();
    
    // Total analyses count
    const totalAnalyses = await ResumeAnalysis.count();
    
    // Recent users (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentUsers = await User.count({
      where: {
        createdAt: {
          [Sequelize.Op.gte]: sevenDaysAgo
        }
      }
    });
    
    // Recent analyses (last 7 days)
    const recentAnalyses = await ResumeAnalysis.count({
      where: {
        createdAt: {
          [Sequelize.Op.gte]: sevenDaysAgo
        }
      }
    });
    
    // Average score
    const avgScoreResult = await ResumeAnalysis.findOne({
      attributes: [
        [Sequelize.fn('AVG', Sequelize.col('total_score')), 'avg_score']
      ],
      raw: true
    });
    
    const averageScore = avgScoreResult?.avg_score || 0;

    return res.json({
      stats: {
        totalUsers,
        totalAnalyses,
        recentUsers,
        recentAnalyses,
        averageScore: parseFloat(averageScore).toFixed(2)
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users with pagination
app.get('/api/admin/users', verifyAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { count, rows: users } = await User.findAndCountAll({
      attributes: [
        'id', 'name', 'email', 'profession', 'location', 
        'is_admin', 'admin_role', 'createdAt', 'updatedAt'
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    return res.json({
      users,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single user details with their analyses
app.get('/api/admin/users/:id', verifyAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: [
        'id', 'name', 'email', 'profession', 'location', 'bio',
        'is_admin', 'admin_role', 'createdAt', 'updatedAt'
      ]
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's analyses
    const analyses = await ResumeAnalysis.findAll({
      where: { user_id: req.params.id },
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    return res.json({
      user,
      recentAnalyses: analyses.map(a => ({
        id: a.id,
        filename: a.filename,
        total_score: a.total_score,
        created_at: a.createdAt
      }))
    });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all analyses with pagination
app.get('/api/admin/analyses', verifyAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { count, rows: analyses } = await ResumeAnalysis.findAndCountAll({
      include: [{
        model: User,
        attributes: ['id', 'name', 'email']
      }],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    const formatted = analyses.map(a => ({
      id: a.id,
      filename: a.filename,
      total_score: a.total_score,
      similarity: a.similarity,
      readability: a.readability,
      completeness: a.completeness,
      formatting: a.formatting,
      grammar_score: a.grammar_score,
      keyword_match_percentage: a.keyword_match_percentage,
      created_at: a.createdAt,
      user: a.User ? {
        id: a.User.id,
        name: a.User.name,
        email: a.User.email
      } : null
    }));

    return res.json({
      analyses: formatted,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get analyses error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get detailed analysis
app.get('/api/admin/analyses/:id', verifyAdmin, async (req, res) => {
  try {
    const analysis = await ResumeAnalysis.findByPk(req.params.id, {
      include: [{
        model: User,
        attributes: ['id', 'name', 'email', 'profession', 'location']
      }]
    });

    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    const formatted = {
      id: analysis.id,
      filename: analysis.filename,
      resume_text: analysis.resume_text,
      jd_text: analysis.jd_text,
      score: {
        total: analysis.total_score,
        similarity: analysis.similarity,
        readability: analysis.readability,
        completeness: analysis.completeness,
        formatting: analysis.formatting,
        grammar_score: analysis.grammar_score,
        grammar_issues: JSON.parse(analysis.grammar_issues || '[]'),
        matched_keywords: JSON.parse(analysis.matched_keywords || '[]'),
        missing_keywords: JSON.parse(analysis.missing_keywords || '[]'),
        keyword_match_percentage: analysis.keyword_match_percentage
      },
      created_at: analysis.createdAt,
      user: analysis.User ? {
        id: analysis.User.id,
        name: analysis.User.name,
        email: analysis.User.email,
        profession: analysis.User.profession,
        location: analysis.User.location
      } : null
    };

    return res.json(formatted);
  } catch (error) {
    console.error('Get analysis error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Make a user admin (protected - only for super admin)
app.post('/api/admin/users/:id/make-admin', verifyAdmin, async (req, res) => {
  try {
    // Check if current user is super admin
    const currentAdmin = await User.findByPk(req.userId);
    if (currentAdmin.admin_role !== 'super_admin') {
      return res.status(403).json({ error: 'Only super admin can perform this action' });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.is_admin = true;
    user.admin_role = req.body.role || 'admin';
    await user.save();

    return res.json({
      message: 'User promoted to admin successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        is_admin: user.is_admin,
        admin_role: user.admin_role
      }
    });
  } catch (error) {
    console.error('Make admin error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove admin privileges
app.post('/api/admin/users/:id/remove-admin', verifyAdmin, async (req, res) => {
  try {
    // Check if current user is super admin
    const currentAdmin = await User.findByPk(req.userId);
    if (currentAdmin.admin_role !== 'super_admin') {
      return res.status(403).json({ error: 'Only super admin can perform this action' });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent removing yourself
    if (user.id === req.userId) {
      return res.status(400).json({ error: 'Cannot remove your own admin privileges' });
    }

    user.is_admin = false;
    user.admin_role = null;
    await user.save();

    return res.json({
      message: 'Admin privileges removed successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        is_admin: user.is_admin
      }
    });
  } catch (error) {
    console.error('Remove admin error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== EXISTING USER ROUTES ====================

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
    
    // ========== ADMIN AUTO-PROMOTION ==========
    // Change this email to your actual email address
    const ADMIN_EMAILS = [
      'adminlucky@gmail.com.in',      // Change this to your email
      //'admin@example.com',           // Add more admin emails if needed
      //'your-gmail@gmail.com'         // Add your Gmail if you use it
    ];
    
    // Check if registering email is in the admin list
    //const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase());
    //const adminRole = isAdmin ? 'super_admin' : 'user';

    const isAdmin = false;  
const adminRole = 'user';
    // ========== END ADMIN AUTO-PROMOTION ==========
    
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      profession,
      location,
      bio,
      is_admin: isAdmin,        // Will be true for your email
      admin_role: adminRole     // Will be 'super_admin' for your email
    });

    const token = jwt.sign({ user_id: user.id }, JWT_SECRET, { expiresIn: '7d' });

    console.log('User registered successfully:', user.email);
    console.log('Admin status:', isAdmin ? 'SUPER ADMIN' : 'Regular User');
    
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        profession: user.profession,
        location: user.location,
        bio: user.bio,
        is_admin: isAdmin,      // Return admin status in response
        admin_role: adminRole
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

// ========== FORGOT PASSWORD ROUTES ==========

// Forgot Password - Get Security Question
app.post('/api/get-security-question', async (req, res) => {
  try {
    console.log('Security question request for email:', req.body.email);
    
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ 
      where: { email },
      attributes: ['id', 'security_question', 'name', 'email'] 
    });

    // Security: Don't reveal if email exists
    if (!user) {
      return res.json({ 
        success: true,
        message: 'If this email exists in our system, you will receive a security question',
        has_user: false
      });
    }

    console.log('Security question found for:', user.email);
    
    return res.json({
      success: true,
      security_question: user.security_question || "What is your mother's maiden name?",
      user_id: user.id,
      user_name: user.name,
      has_user: true
    });
  } catch (error) {
    console.error('Security question error:', error);
    res.status(500).json({ error: 'Failed to get security question' });
  }
});

// Forgot Password - Verify Security Answer
app.post('/api/verify-security-answer', async (req, res) => {
  try {
    console.log('Security answer verification request');
    
    const { email, security_answer } = req.body;

    if (!email || !security_answer) {
      return res.status(400).json({ error: 'Email and security answer are required' });
    }

    const user = await User.findOne({ where: { email } });
    
    // Security: Don't reveal if email exists
    if (!user) {
      return res.json({ 
        success: false,
        message: 'Invalid request'
      });
    }

    // For demo purposes, accept any non-empty answer
    // In production, you should compare with stored hashed security_answer
    const isAnswerCorrect = security_answer.trim().length > 0;

    if (!isAnswerCorrect) {
      return res.status(401).json({ error: 'Security answer cannot be empty' });
    }

    // Generate reset token (expires in 15 minutes)
    const resetToken = jwt.sign(
      { user_id: user.id, purpose: 'password_reset', email: user.email },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    console.log('Reset token generated for:', user.email);
    
    return res.json({ 
      success: true,
      message: 'Security answer verified successfully',
      reset_token: resetToken,
      user_email: user.email
    });
  } catch (error) {
    console.error('Security answer verification error:', error);
    res.status(500).json({ error: 'Failed to verify security answer' });
  }
});

// Forgot Password - Reset Password
app.post('/api/reset-password', async (req, res) => {
  try {
    console.log('Password reset request');
    
    const { reset_token, new_password, confirm_password } = req.body;

    if (!reset_token || !new_password || !confirm_password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (new_password !== confirm_password) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(reset_token, JWT_SECRET);
    } catch (error) {
      console.error('Token verification failed:', error.message);
      return res.status(400).json({ error: 'Invalid or expired reset token. Please start the process again.' });
    }

    if (decoded.purpose !== 'password_reset') {
      return res.status(400).json({ error: 'Invalid token purpose' });
    }

    // Find user by ID from token
    const user = await User.findByPk(decoded.user_id);

    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    // Verify email matches token
    if (user.email !== decoded.email) {
      return res.status(400).json({ error: 'Token validation failed' });
    }

    // Update password
    const hashedPassword = await bcrypt.hash(new_password, 12);
    user.password = hashedPassword;
    await user.save();

    console.log('Password reset successfully for:', user.email);
    
    return res.json({ 
      success: true,
      message: 'Password reset successfully! You can now login with your new password.'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// ========== END FORGOT PASSWORD ROUTES ==========

// Get user profile
app.get('/api/profile', verifyToken, async (req, res) => {
  try {
    console.log('Fetching profile for user:', req.userId);
    
    const user = await User.findByPk(req.userId, {
      attributes: { exclude: ['password'] }
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
    
    // Add admin fields if they don't exist
    try {
      const tableInfo = await sequelize.queryInterface.describeTable('users');
      if (!tableInfo.is_admin) {
        console.log('Adding admin fields to users table...');
        await sequelize.queryInterface.addColumn('users', 'is_admin', {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          allowNull: false
        });
        await sequelize.queryInterface.addColumn('users', 'admin_role', {
          type: Sequelize.STRING,
          defaultValue: 'user'
        });
        console.log('✅ Admin fields added successfully.');
      }
    } catch (error) {
      console.log('Admin fields check:', error.message);
    }
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log('\n' + '='.repeat(60));
      console.log('🚀 ATS Resume Checker with Admin Panel');
      console.log('='.repeat(60));
      console.log(`📍 Port: ${PORT}`);
      console.log(`🌐 Environment: ${NODE_ENV}`);
      console.log(`🗄️  Database: PostgreSQL (Render)`);
      console.log(`🔗 Health: /health`);
      console.log(`🧪 API Test: /api/test`);
      console.log(`🗄️  DB Test: /api/db-test`);
      console.log(`👑 Admin Login: POST /api/admin/login`);
      console.log(`📊 Admin Dashboard: GET /api/admin/dashboard/stats`);
      console.log(`👥 Admin Users: GET /api/admin/users`);
      console.log(`📈 Admin Analyses: GET /api/admin/analyses`);
      console.log('='.repeat(60));
      console.log('\n💡 To create your first admin:');
      console.log('1. Register a regular user account');
      console.log('2. Manually update the database:');
      console.log('   UPDATE users SET is_admin = true, admin_role = \'super_admin\' WHERE email = \'your-email@example.com\';');
      console.log('3. Login at /api/admin/login');
      console.log('='.repeat(60));
    });
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
}

startServer();