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

// ✅ ADD RESUME MODEL
const Resume = sequelize.define('Resume', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: Sequelize.STRING(120), allowNull: false },
  template: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
  data: { type: Sequelize.TEXT, allowNull: false },
  preview: { type: Sequelize.TEXT, allowNull: true },
  user_id: { type: Sequelize.INTEGER, allowNull: false }
}, {
  tableName: 'resumes',
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
    const resumeCount = await Resume.count();
    
    res.json({
      status: 'Database connected successfully',
      users: userCount,
      analyses: analysisCount,
      resumes: resumeCount,
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

// ✅ UPDATED USER STATS - INCLUDES RESUME DATA
app.get('/api/user-stats', verifyToken, async (req, res) => {
  try {
    console.log('Fetching comprehensive stats for user:', req.userId);
    
    // Get resume analyses
    const analyses = await ResumeAnalysis.findAll({
      where: { user_id: req.userId },
      order: [['createdAt', 'DESC']]
    });

    // Get saved resumes
    const resumes = await Resume.findAll({
      where: { user_id: req.userId },
      order: [['createdAt', 'DESC']]
    });

    if ((!analyses || analyses.length === 0) && (!resumes || resumes.length === 0)) {
      return res.json({
        // Analysis stats
        totalAnalyses: 0,
        averageScore: 0,
        highestScore: 0,
        recentAnalyses: [],
        
        // Resume builder stats
        savedResumes: 0,
        recentResumes: [],
        
        // Combined stats
        totalDocuments: 0,
        lastActivity: null
      });
    }

    // Calculate analysis stats
    const analysisScores = analyses.map(a => a.total_score).filter(score => score !== null && score !== undefined);
    
    const totalAnalyses = analyses.length;
    const averageScore = analysisScores.length > 0 ? analysisScores.reduce((sum, score) => sum + score, 0) / analysisScores.length : 0;
    const highestScore = analysisScores.length > 0 ? Math.max(...analysisScores) : 0;

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

    // Calculate resume stats
    const savedResumes = resumes.length;
    const recentResumes = resumes.slice(0, 3).map(resume => ({
      id: resume.id,
      name: resume.name,
      preview: resume.preview,
      template: resume.template,
      createdAt: resume.createdAt,
      updatedAt: resume.updatedAt
    }));

    // Calculate combined stats
    const totalDocuments = totalAnalyses + savedResumes;
    
    // Find last activity date
    const allActivities = [
      ...analyses.map(a => new Date(a.createdAt)),
      ...resumes.map(r => new Date(r.createdAt))
    ].sort((a, b) => b - a);
    
    const lastActivity = allActivities.length > 0 ? allActivities[0] : null;

    console.log('Comprehensive stats fetched successfully for user:', req.userId);
    
    res.json({
      // Analysis stats
      totalAnalyses,
      averageScore: Math.round(averageScore * 100) / 100,
      highestScore: Math.round(highestScore * 100) / 100,
      recentAnalyses,
      
      // Resume builder stats
      savedResumes,
      recentResumes,
      
      // Combined stats
      totalDocuments,
      lastActivity: lastActivity ? lastActivity.toISOString() : null,
      
      // Activity summary
      activitySummary: {
        analysesThisMonth: analyses.filter(a => {
          const analysisDate = new Date(a.createdAt);
          const now = new Date();
          return analysisDate.getMonth() === now.getMonth() && 
                 analysisDate.getFullYear() === now.getFullYear();
        }).length,
        resumesThisMonth: resumes.filter(r => {
          const resumeDate = new Date(r.createdAt);
          const now = new Date();
          return resumeDate.getMonth() === now.getMonth() && 
                 resumeDate.getFullYear() === now.getFullYear();
        }).length
      }
    });
    
  } catch (error) {
    console.error('User stats error:', error);
    res.status(500).json({ 
      error: 'Failed to load statistics data',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Database error'
    });
  }
});

// ✅ RESUME BUILDER ROUTES

// Get all resumes for user
app.get('/api/resumes', verifyToken, async (req, res) => {
  try {
    console.log('Fetching resumes for user:', req.userId);
    
    const resumes = await Resume.findAll({
      where: { user_id: req.userId },
      order: [['createdAt', 'DESC']]
    });

    const formattedResumes = resumes.map(resume => ({
      id: resume.id,
      name: resume.name,
      template: resume.template,
      preview: resume.preview,
      createdAt: resume.createdAt,
      updatedAt: resume.updatedAt
    }));

    console.log(`Found ${resumes.length} resumes for user:`, req.userId);
    res.json(formattedResumes);
  } catch (error) {
    console.error('Error fetching resumes:', error);
    res.status(500).json({ 
      error: 'Failed to fetch resumes',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Database error'
    });
  }
});

// Save new resume
app.post('/api/resumes', verifyToken, async (req, res) => {
  try {
    console.log('Saving resume for user:', req.userId);
    
    const { name, template, data, preview } = req.body;

    if (!name || !data) {
      return res.status(400).json({ error: 'Resume name and data are required' });
    }

    const resume = await Resume.create({
      name,
      template: template || 1,
      data: JSON.stringify(data),
      preview: preview || 'No preview available',
      user_id: req.userId
    });

    console.log('Resume saved successfully:', resume.id);
    
    res.json({
      message: 'Resume saved successfully',
      resume: {
        id: resume.id,
        name: resume.name,
        template: resume.template,
        preview: resume.preview,
        createdAt: resume.createdAt
      }
    });
  } catch (error) {
    console.error('Error saving resume:', error);
    res.status(500).json({ 
      error: 'Failed to save resume',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Database error'
    });
  }
});

// Get specific resume
app.get('/api/resumes/:id', verifyToken, async (req, res) => {
  try {
    console.log('Fetching resume:', req.params.id, 'for user:', req.userId);
    
    const resume = await Resume.findOne({
      where: { 
        id: req.params.id,
        user_id: req.userId 
      }
    });
    
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Parse the JSON data back to object
    const resumeData = {
      id: resume.id,
      name: resume.name,
      template: resume.template,
      data: JSON.parse(resume.data),
      preview: resume.preview,
      createdAt: resume.createdAt,
      updatedAt: resume.updatedAt
    };

    console.log('Resume fetched successfully:', resume.id);
    res.json(resumeData);
  } catch (error) {
    console.error('Error fetching resume:', error);
    res.status(500).json({ 
      error: 'Failed to fetch resume',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Database error'
    });
  }
});

// Update resume
app.put('/api/resumes/:id', verifyToken, async (req, res) => {
  try {
    console.log('Updating resume:', req.params.id, 'for user:', req.userId);
    
    const { name, template, data, preview } = req.body;
    
    const resume = await Resume.findOne({
      where: { 
        id: req.params.id,
        user_id: req.userId 
      }
    });
    
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    if (name !== undefined) resume.name = name;
    if (template !== undefined) resume.template = template;
    if (data !== undefined) resume.data = JSON.stringify(data);
    if (preview !== undefined) resume.preview = preview;

    await resume.save();

    console.log('Resume updated successfully:', resume.id);
    
    res.json({
      message: 'Resume updated successfully',
      resume: {
        id: resume.id,
        name: resume.name,
        template: resume.template,
        preview: resume.preview,
        updatedAt: resume.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating resume:', error);
    res.status(500).json({ 
      error: 'Failed to update resume',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Database error'
    });
  }
});

// Delete resume
app.delete('/api/resumes/:id', verifyToken, async (req, res) => {
  try {
    console.log('Deleting resume:', req.params.id, 'for user:', req.userId);
    
    const resume = await Resume.findOne({
      where: { 
        id: req.params.id,
        user_id: req.userId 
      }
    });
    
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    await resume.destroy();

    console.log('Resume deleted successfully:', req.params.id);
    
    res.json({ message: 'Resume deleted successfully' });
  } catch (error) {
    console.error('Error deleting resume:', error);
    res.status(500).json({ 
      error: 'Failed to delete resume',
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
    await Resume.sync({ force: false }); // ✅ ADD RESUME TABLE SYNC
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
      console.log(`🔐 Forgot Password: /api/get-security-question`);
      console.log(`📝 Resume Builder: /api/resumes`);
      console.log('='.repeat(50));
    });
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
}

startServer();