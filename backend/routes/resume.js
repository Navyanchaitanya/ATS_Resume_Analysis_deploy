// routes/resumes.js
const express = require('express');
const { Resume } = require('../models'); // You'll need to create this model
const verifyToken = require('../middleware/auth');

const router = express.Router();

// Get all resumes for user
router.get('/resumes', verifyToken, async (req, res) => {
  try {
    const resumes = await Resume.findAll({
      where: { user_id: req.userId },
      order: [['createdAt', 'DESC']]
    });
    res.json(resumes);
  } catch (error) {
    console.error('Error fetching resumes:', error);
    res.status(500).json({ error: 'Failed to fetch resumes' });
  }
});

// Save new resume
router.post('/resumes', verifyToken, async (req, res) => {
  try {
    const { name, template, data, preview } = req.body;
    
    const resume = await Resume.create({
      name,
      template,
      data: JSON.stringify(data),
      preview,
      user_id: req.userId
    });
    
    res.json(resume);
  } catch (error) {
    console.error('Error saving resume:', error);
    res.status(500).json({ error: 'Failed to save resume' });
  }
});

// Get specific resume
router.get('/resumes/:id', verifyToken, async (req, res) => {
  try {
    const resume = await Resume.findOne({
      where: { 
        id: req.params.id,
        user_id: req.userId 
      }
    });
    
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }
    
    res.json(resume);
  } catch (error) {
    console.error('Error fetching resume:', error);
    res.status(500).json({ error: 'Failed to fetch resume' });
  }
});

// Delete resume
router.delete('/resumes/:id', verifyToken, async (req, res) => {
  try {
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
    res.json({ message: 'Resume deleted successfully' });
  } catch (error) {
    console.error('Error deleting resume:', error);
    res.status(500).json({ error: 'Failed to delete resume' });
  }
});

module.exports = router;