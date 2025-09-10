const express = require('express');
const multer = require('multer');
const { ResumeAnalysis } = require('../models');
const { extractTextFromPdf } = require('../utils/pdfParser');
const { overallScore } = require('../utils/scorer');
const verifyToken = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads with limits
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Error handling middleware for multer
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

// Analyze resume route
router.post('/analyze', upload.single('resume'), handleMulterError, async (req, res) => {
  try {
    console.log("Analyze endpoint hit");
    console.log("Request file:", req.file ? req.file.originalname : 'No file');
    console.log("Job description present:", !!req.body.job_description);

    if (!req.file) {
      return res.status(400).json({ error: 'No resume file uploaded' });
    }

    if (!req.body.job_description) {
      return res.status(400).json({ error: 'Job description is required' });
    }

    const resumeFile = req.file;
    const jobDescription = req.body.job_description;

    console.log("File received:", resumeFile.originalname, resumeFile.size, "bytes");
    console.log("Job description length:", jobDescription.length, "characters");

    // Extract text from PDF
    const resumeText = await extractTextFromPdf(resumeFile.buffer);
    const jdText = jobDescription.trim();

    console.log("Resume text length:", resumeText.length, "characters");
    console.log("JD text length:", jdText.length, "characters");

    if (!resumeText) {
      return res.status(400).json({ error: 'Could not extract text from PDF. The file might be corrupted or scanned.' });
    }

    if (!jdText) {
      return res.status(400).json({ error: 'Job description cannot be empty' });
    }

    // Get user ID from token if available
    let userId = null;
    try {
      const token = req.headers.authorization;
      if (token) {
        const actualToken = token.startsWith('Bearer ') ? token.slice(7) : token;
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';
        const decoded = jwt.verify(actualToken, JWT_SECRET);
        userId = decoded.user_id;
        console.log("User ID from token:", userId);
      }
    } catch (error) {
      console.warn('Invalid token, proceeding without user ID:', error.message);
    }

    // Calculate score
    const scoreData = await overallScore(resumeText, jdText);
    console.log('🔍 Score data:', scoreData);

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
      user_id: userId
    });

    console.log("Analysis saved to database with ID:", analysis.id);

    return res.json({
      score: scoreData,
      filename: resumeFile.originalname
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// Get results route
router.get('/results', async (req, res) => {
  try {
    const results = await ResumeAnalysis.findAll({
      order: [['id', 'DESC']],
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
      }
    }));

    return res.json(formatted);
  } catch (error) {
    console.error('Results fetch error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;