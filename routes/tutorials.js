const express = require('express');
const { adminAuth } = require('../middleware/auth');
const TutorialVideo = require('../models/TutorialVideo');

const router = express.Router();

// Public: list published tutorials (optional filters)
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const query = { isPublished: true };
    if (category) query.category = category;

    const videos = await TutorialVideo.find(query).sort({ order: 1, createdAt: -1 });
    res.json({ success: true, videos });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to load tutorials' });
  }
});

// Admin: list all tutorials
router.get('/admin', adminAuth, async (req, res) => {
  try {
    const videos = await TutorialVideo.find().sort({ order: 1, createdAt: -1 });
    res.json({ success: true, videos });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to load tutorials' });
  }
});

// Admin: create tutorial
router.post('/', adminAuth, async (req, res) => {
  try {
    const { title, description, url, category, order, isPublished, thumbnailUrl } = req.body;
    if (!title || !url) {
      return res.status(400).json({ success: false, error: 'Title and URL are required' });
    }
    const video = await TutorialVideo.create({ title, description, url, category, order, isPublished, thumbnailUrl });
    res.json({ success: true, video });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create tutorial' });
  }
});

// Admin: update tutorial
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const update = req.body;
    const video = await TutorialVideo.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!video) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, video });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update tutorial' });
  }
});

// Admin: delete tutorial
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const video = await TutorialVideo.findByIdAndDelete(req.params.id);
    if (!video) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete tutorial' });
  }
});

module.exports = router;


