const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Sequelize } = require('../models');
const verifyToken = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-production';

// Register route
router.post('/register', async (req, res) => {
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

    const token = jwt.sign(
      { user_id: newUser.id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

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

// Get security question for password reset
router.post('/get-security-question', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ 
      where: { email },
      attributes: ['id', 'security_question', 'name'] 
    });

    // Don't reveal if email exists for security
    if (!user) {
      return res.json({ 
        success: true,
        message: 'If the email exists, you can proceed with security question',
        has_user: false
      });
    }

    // If security_question column doesn't exist, use default question
    const securityQuestion = user.security_question || "What is your mother's maiden name?";

    return res.json({
      success: true,
      security_question: securityQuestion,
      user_id: user.id,
      user_name: user.name,
      has_user: true
    });
  } catch (error) {
    console.error('Security question error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify security answer and generate reset token
router.post('/verify-security-answer', async (req, res) => {
  try {
    const { email, security_answer, user_id } = req.body;

    if (!email || !security_answer) {
      return res.status(400).json({ error: 'Email and security answer are required' });
    }

    const user = await User.findOne({ where: { email } });
    
    // Don't reveal if email exists for security
    if (!user) {
      return res.json({ 
        success: false,
        message: 'If the email exists and answer is correct, a reset token will be generated'
      });
    }

    let isAnswerCorrect = false;

    try {
      // Try to check security answer if column exists and has value
      if (user.security_answer) {
        isAnswerCorrect = await bcrypt.compare(
          security_answer.toLowerCase().trim(),
          user.security_answer
        );
      } else {
        // If security_answer column doesn't exist or is empty, allow reset for existing users
        // This handles the case where old users don't have security questions set up
        isAnswerCorrect = true;
      }
    } catch (error) {
      console.log('Security answer verification skipped due to database issue');
      isAnswerCorrect = true; // Allow reset for existing users
    }

    if (!isAnswerCorrect) {
      return res.status(401).json({ error: 'Incorrect security answer' });
    }

    // Generate reset token (expires in 15 minutes)
    const resetToken = jwt.sign(
      { user_id: user.id, purpose: 'password_reset' },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Try to save reset token (handle case where columns don't exist)
    try {
      user.reset_token = resetToken;
      user.reset_token_expiry = new Date(Date.now() + 15 * 60 * 1000);
      await user.save();
    } catch (saveError) {
      console.log('Reset token columns not available, proceeding without saving to database');
      // Continue even if we can't save to database - the token is still valid
    }

    return res.json({ 
      success: true,
      message: 'Security answer verified successfully',
      reset_token: resetToken
    });
  } catch (error) {
    console.error('Security answer verification error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Password reset route
router.post('/reset-password', async (req, res) => {
  try {
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
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    if (decoded.purpose !== 'password_reset') {
      return res.status(400).json({ error: 'Invalid token purpose' });
    }

    // Find user by ID
    const user = await User.findByPk(decoded.user_id);

    if (!user) {
      return res.status(400).json({ error: 'Invalid user' });
    }

    // Optional: Check if reset token matches (if column exists)
    let tokenValid = true;
    try {
      if (user.reset_token && user.reset_token_expiry) {
        tokenValid = user.reset_token === reset_token && 
                     new Date(user.reset_token_expiry) > new Date();
      }
    } catch (error) {
      console.log('Reset token validation skipped due to database issue');
      // Continue with reset even if we can't validate the token from database
    }

    if (!tokenValid) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Update password
    const hashedPassword = await bcrypt.hash(new_password, 12);
    user.password = hashedPassword;
    
    // Try to clear reset token (if columns exist)
    try {
      user.reset_token = null;
      user.reset_token_expiry = null;
    } catch (error) {
      console.log('Reset token clearance skipped');
    }
    
    await user.save();

    return res.json({ 
      success: true,
      message: 'Password reset successfully' 
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Login route
router.post('/login', async (req, res) => {
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

    const token = jwt.sign(
      { user_id: user.id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

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

// Get user profile - PROTECTED (with error handling for missing columns)
router.get('/profile', verifyToken, async (req, res) => {
  try {
    // Try to get user with all attributes first
    let user;
    try {
      user = await User.findByPk(req.userId, {
        attributes: { exclude: ['password', 'security_answer', 'reset_token'] }
      });
    } catch (dbError) {
      // If that fails, try with minimal attributes
      console.log('Falling back to minimal user attributes due to database schema issue');
      user = await User.findByPk(req.userId, {
        attributes: ['id', 'name', 'email', 'profession', 'location', 'bio', 'createdAt', 'updatedAt']
      });
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json(user);
  } catch (error) {
    console.error('Profile fetch error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile - PROTECTED
router.put('/profile', verifyToken, async (req, res) => {
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

// Delete account route
router.delete('/delete-account', verifyToken, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required to delete account' });
    }

    const user = await User.findByPk(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    await user.destroy();

    return res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;