const express = require('express');
const { ResumeAnalysis } = require('../models');
const verifyToken = require('../middleware/auth');

const router = express.Router();

// Get user stats - FILTERED BY USER ID
router.get('/stats', verifyToken, async (req, res) => {
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