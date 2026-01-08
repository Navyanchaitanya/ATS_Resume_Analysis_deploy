const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-production';

// Middleware to verify admin access
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

    // Check if user is admin (you'll need to add is_admin field to User model)
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

module.exports = verifyAdmin;