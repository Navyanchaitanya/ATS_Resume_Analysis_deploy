const express = require('express');
const multer = require('multer');
const { ResumeAnalysis } = require('../models');
const { extractTextFromPdf } = require('../utils/pdfParser');
const { overallScore } = require('../utils/scorer');
const verifyToken = require('../middleware/auth');

const router = express.Router();

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

// Analyze resume route - PROTECTED
router.post('/analyze', verifyToken, upload.single('resume'), handleMulterError, async (req, res) => {
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

    // Save to database WITH USER ID
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
      user_id: req.userId // ✅ Associate with authenticated user
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

// Get user's analysis results - FILTERED BY USER ID
router.get('/results', verifyToken, async (req, res) => {
  try {
    const results = await ResumeAnalysis.findAll({
      where: { user_id: req.userId }, // ✅ ONLY current user's data
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

// Get specific analysis by ID - VERIFIES USER OWNERSHIP
router.get('/results/:id', verifyToken, async (req, res) => {
  try {
    const analysis = await ResumeAnalysis.findOne({
      where: { 
        id: req.params.id,
        user_id: req.userId // ✅ Verify user owns this analysis
      }
    });

    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    const formatted = {
      id: analysis.id,
      filename: analysis.filename,
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
      created_at: analysis.createdAt
    };

    return res.json(formatted);
  } catch (error) {
    console.error('Analysis fetch error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user stats - FILTERED BY USER ID
router.get('/user-stats', verifyToken, async (req, res) => {
  try {
    const analyses = await ResumeAnalysis.findAll({
      where: { user_id: req.userId }, // ✅ ONLY current user's data
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

module.exports = router;