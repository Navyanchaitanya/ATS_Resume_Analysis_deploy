const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, ResumeAnalysis, Sequelize } = require('../models');
const verifyAdmin = require('../middleware/adminAuth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-production';

// ==================== ADMIN AUTHENTICATION ====================

// Admin login (separate from regular user login)
router.post('/login', async (req, res) => {
  try {
    const { email, password, admin_key } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is admin (optional: you can require admin_key for extra security)
    if (!user.is_admin) {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    // Optional: verify admin key if provided
    if (admin_key && admin_key !== process.env.ADMIN_SECRET_KEY) {
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

// ==================== DASHBOARD STATISTICS ====================

// Get admin dashboard stats
router.get('/dashboard/stats', verifyAdmin, async (req, res) => {
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

// ==================== USER MANAGEMENT ====================

// Get all users with pagination
router.get('/users', verifyAdmin, async (req, res) => {
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
router.get('/users/:id', verifyAdmin, async (req, res) => {
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

// ==================== ANALYSIS MANAGEMENT ====================

// Get all analyses with pagination
router.get('/analyses', verifyAdmin, async (req, res) => {
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
router.get('/analyses/:id', verifyAdmin, async (req, res) => {
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

// ==================== ADMIN MANAGEMENT ====================

// Make a user admin (protected - only for super admin)
router.post('/users/:id/make-admin', verifyAdmin, async (req, res) => {
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
router.post('/users/:id/remove-admin', verifyAdmin, async (req, res) => {
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

module.exports = router;