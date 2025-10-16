// In your existing user.js route file or analyze.js route file
const express = require('express');
const { ResumeAnalysis, Resume } = require('../models'); // Make sure to import Resume model
const verifyToken = require('../middleware/auth');

const router = express.Router();

// Get comprehensive user stats including resumes
router.get('/user-stats', verifyToken, async (req, res) => {
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

module.exports = router;