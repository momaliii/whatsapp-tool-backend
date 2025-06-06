<<<<<<< HEAD
const express = require('express');
const User = require('../models/User');
const LicenseKey = require('../models/LicenseKey');
const Plan = require('../models/Plan');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get points balance
router.get('/balance', authenticate, async (req, res) => {
  res.json({
    success: true,
    points: req.user.points,
    usage: req.user.usage
  });
});

// Redeem license key
router.post('/redeem', authenticate, async (req, res) => {
  try {
    const { key } = req.body;
    
    if (!key) {
      return res.status(400).json({ error: 'License key is required' });
    }
    
    // Find license key
    const licenseKey = await LicenseKey.findOne({ 
      key: key.trim(),
      used: false 
    });
    
    if (!licenseKey) {
      return res.status(400).json({ error: 'Invalid or already used license key' });
    }
    
    // Check expiration
    if (licenseKey.expiresAt && licenseKey.expiresAt < new Date()) {
      return res.status(400).json({ error: 'License key has expired' });
    }
    
    // Apply license key benefits
    const user = await User.findById(req.user._id);
    
    // Add points
    if (licenseKey.points > 0) {
      user.points += licenseKey.points;
    }
    
    // Update subscription
    if (licenseKey.subscription && licenseKey.subscription.plan) {
      user.subscription.plan = licenseKey.subscription.plan;
      const durationMs = licenseKey.subscription.duration * 24 * 60 * 60 * 1000;
      
      if (user.subscription.expiresAt && user.subscription.expiresAt > new Date()) {
        // Extend existing subscription
        user.subscription.expiresAt = new Date(user.subscription.expiresAt.getTime() + durationMs);
      } else {
        // New subscription
        user.subscription.expiresAt = new Date(Date.now() + durationMs);
      }
    }
    
    await user.save();
    
    // Mark key as used
    licenseKey.used = true;
    licenseKey.usedBy = user._id;
    licenseKey.usedAt = new Date();
    await licenseKey.save();
    
    res.json({
      success: true,
      message: 'License key redeemed successfully',
      points: user.points,
      subscription: user.subscription
    });
  } catch (error) {
    console.error('Redeem error:', error);
    res.status(500).json({ error: 'Error redeeming license key' });
  }
});

// Check points before operation
router.post('/check', authenticate, async (req, res) => {
  try {
    const { operation, count = 1 } = req.body;
    
    // Get user's plan
    const plan = await Plan.findOne({ name: req.user.subscription.plan });
    if (!plan) {
      return res.status(500).json({ error: 'Plan configuration not found' });
    }
    
    // Calculate cost
    const costPerUnit = plan.pointCosts[operation] || 1;
    const totalCost = costPerUnit * count;
    
    // Check if user has enough points
    const hasEnoughPoints = req.user.points >= totalCost;
    
    res.json({
      success: true,
      hasEnoughPoints,
      currentPoints: req.user.points,
      requiredPoints: totalCost,
      costPerUnit,
      operation
    });
  } catch (error) {
    res.status(500).json({ error: 'Error checking points' });
  }
});

// Deduct points for operation
router.post('/deduct', authenticate, async (req, res) => {
  try {
    const { operation, count = 1 } = req.body;
    
    // Get user's plan
    const plan = await Plan.findOne({ name: req.user.subscription.plan });
    if (!plan) {
      return res.status(500).json({ error: 'Plan configuration not found' });
    }
    
    // Calculate cost
    const costPerUnit = plan.pointCosts[operation] || 1;
    const totalCost = costPerUnit * count;
    
    // Get fresh user data
    const user = await User.findById(req.user._id);
    
    // Check points
    if (user.points < totalCost) {
      return res.status(403).json({
        error: 'Insufficient points',
        required: totalCost,
        available: user.points
      });
    }
    
    // Deduct points
    user.points -= totalCost;
    
    // Update usage statistics
    const usageMap = {
      sendMessage: 'messagesTotal',
      addMember: 'groupsAdded',
      extractMember: 'extractedMembers',
      validateNumber: 'validatedNumbers'
    };
    
    if (usageMap[operation]) {
      user.usage[usageMap[operation]] += count;
      if (operation === 'sendMessage') {
        user.usage.messagesThisMonth += count;
      }
    }
    
    await user.save();
    
    res.json({
      success: true,
      pointsDeducted: totalCost,
      remainingPoints: user.points,
      usage: user.usage
    });
  } catch (error) {
    console.error('Deduct error:', error);
    res.status(500).json({ error: 'Error deducting points' });
  }
});

// Get points packages (for purchase)
router.get('/packages', async (req, res) => {
  const packages = [
    { id: 'pack_500', points: 500, price: 5, currency: 'USD' },
    { id: 'pack_1000', points: 1000, price: 15, currency: 'USD', popular: true },
    { id: 'pack_2500', points: 2500, price: 30, currency: 'USD' },
    { id: 'pack_5000', points: 5000, price: 50, currency: 'USD' },
  ];
  res.json({ success: true, packages });
});

=======
const express = require('express');
const User = require('../models/User');
const LicenseKey = require('../models/LicenseKey');
const Plan = require('../models/Plan');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get points balance
router.get('/balance', authenticate, async (req, res) => {
  res.json({
    success: true,
    points: req.user.points,
    usage: req.user.usage
  });
});

// Redeem license key
router.post('/redeem', authenticate, async (req, res) => {
  try {
    const { key } = req.body;
    
    if (!key) {
      return res.status(400).json({ error: 'License key is required' });
    }
    
    // Find license key
    const licenseKey = await LicenseKey.findOne({ 
      key: key.trim(),
      used: false 
    });
    
    if (!licenseKey) {
      return res.status(400).json({ error: 'Invalid or already used license key' });
    }
    
    // Check expiration
    if (licenseKey.expiresAt && licenseKey.expiresAt < new Date()) {
      return res.status(400).json({ error: 'License key has expired' });
    }
    
    // Apply license key benefits
    const user = await User.findById(req.user._id);
    
    // Add points
    if (licenseKey.points > 0) {
      user.points += licenseKey.points;
    }
    
    // Update subscription
    if (licenseKey.subscription && licenseKey.subscription.plan) {
      user.subscription.plan = licenseKey.subscription.plan;
      const durationMs = licenseKey.subscription.duration * 24 * 60 * 60 * 1000;
      
      if (user.subscription.expiresAt && user.subscription.expiresAt > new Date()) {
        // Extend existing subscription
        user.subscription.expiresAt = new Date(user.subscription.expiresAt.getTime() + durationMs);
      } else {
        // New subscription
        user.subscription.expiresAt = new Date(Date.now() + durationMs);
      }
    }
    
    await user.save();
    
    // Mark key as used
    licenseKey.used = true;
    licenseKey.usedBy = user._id;
    licenseKey.usedAt = new Date();
    await licenseKey.save();
    
    res.json({
      success: true,
      message: 'License key redeemed successfully',
      points: user.points,
      subscription: user.subscription
    });
  } catch (error) {
    console.error('Redeem error:', error);
    res.status(500).json({ error: 'Error redeeming license key' });
  }
});

// Check points before operation
router.post('/check', authenticate, async (req, res) => {
  try {
    const { operation, count = 1 } = req.body;
    
    // Get user's plan
    const plan = await Plan.findOne({ name: req.user.subscription.plan });
    if (!plan) {
      return res.status(500).json({ error: 'Plan configuration not found' });
    }
    
    // Calculate cost
    const costPerUnit = plan.pointCosts[operation] || 1;
    const totalCost = costPerUnit * count;
    
    // Check if user has enough points
    const hasEnoughPoints = req.user.points >= totalCost;
    
    res.json({
      success: true,
      hasEnoughPoints,
      currentPoints: req.user.points,
      requiredPoints: totalCost,
      costPerUnit,
      operation
    });
  } catch (error) {
    res.status(500).json({ error: 'Error checking points' });
  }
});

// Deduct points for operation
router.post('/deduct', authenticate, async (req, res) => {
  try {
    const { operation, count = 1 } = req.body;
    
    // Get user's plan
    const plan = await Plan.findOne({ name: req.user.subscription.plan });
    if (!plan) {
      return res.status(500).json({ error: 'Plan configuration not found' });
    }
    
    // Calculate cost
    const costPerUnit = plan.pointCosts[operation] || 1;
    const totalCost = costPerUnit * count;
    
    // Get fresh user data
    const user = await User.findById(req.user._id);
    
    // Check points
    if (user.points < totalCost) {
      return res.status(403).json({
        error: 'Insufficient points',
        required: totalCost,
        available: user.points
      });
    }
    
    // Deduct points
    user.points -= totalCost;
    
    // Update usage statistics
    const usageMap = {
      sendMessage: 'messagesTotal',
      addMember: 'groupsAdded',
      extractMember: 'extractedMembers',
      validateNumber: 'validatedNumbers'
    };
    
    if (usageMap[operation]) {
      user.usage[usageMap[operation]] += count;
      if (operation === 'sendMessage') {
        user.usage.messagesThisMonth += count;
      }
    }
    
    await user.save();
    
    res.json({
      success: true,
      pointsDeducted: totalCost,
      remainingPoints: user.points,
      usage: user.usage
    });
  } catch (error) {
    console.error('Deduct error:', error);
    res.status(500).json({ error: 'Error deducting points' });
  }
});

// Get points packages (for purchase)
router.get('/packages', async (req, res) => {
  const packages = [
    { id: 'pack_500', points: 500, price: 5, currency: 'USD' },
    { id: 'pack_1000', points: 1000, price: 15, currency: 'USD', popular: true },
    { id: 'pack_2500', points: 2500, price: 30, currency: 'USD' },
    { id: 'pack_5000', points: 5000, price: 50, currency: 'USD' },
  ];
  res.json({ success: true, packages });
});

>>>>>>> c748219ba1adc3796d601867ddd17133d2a092e1
module.exports = router;