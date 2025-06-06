<<<<<<< HEAD
const express = require('express');
const crypto = require('crypto');
const User = require('../models/User');
const LicenseKey = require('../models/LicenseKey');
const Plan = require('../models/Plan');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// Generate random license key
const generateLicenseKey = () => {
  return `WA-${crypto.randomBytes(4).toString('hex').toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
};

// Get dashboard stats
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const paidUsers = await User.countDocuments({ 'subscription.plan': { $ne: 'free' } });
    
    const totalKeys = await LicenseKey.countDocuments();
    const usedKeys = await LicenseKey.countDocuments({ used: true });
    
    // Calculate revenue (simplified)
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const monthlyUsers = await User.countDocuments({
      'subscription.plan': { $ne: 'free' },
      'subscription.expiresAt': { $gte: thisMonth }
    });
    
    res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        paidUsers,
        totalKeys,
        usedKeys,
        availableKeys: totalKeys - usedKeys,
        estimatedMRR: monthlyUsers * 20 // Simplified calculation
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching stats' });
  }
});

// Create license keys
router.post('/keys/generate', adminAuth, async (req, res) => {
  try {
    const { 
      type = 'points',
      points = 0,
      plan,
      duration = 30,
      quantity = 1,
      expiresIn = 90,
      notes
    } = req.body;
    
    const keys = [];
    
    for (let i = 0; i < quantity; i++) {
      const keyData = {
        key: generateLicenseKey(),
        type,
        points,
        notes
      };
      
      if (type === 'subscription' || type === 'both') {
        keyData.subscription = { plan, duration };
      }
      
      if (expiresIn > 0) {
        keyData.expiresAt = new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000);
      }
      
      const licenseKey = new LicenseKey(keyData);
      await licenseKey.save();
      keys.push(licenseKey);
    }
    
    res.json({
      success: true,
      message: `Generated ${quantity} license key(s)`,
      keys: keys.map(k => ({
        key: k.key,
        type: k.type,
        points: k.points,
        plan: k.subscription?.plan,
        expiresAt: k.expiresAt
      }))
    });
  } catch (error) {
    console.error('Generate keys error:', error);
    res.status(500).json({ error: 'Error generating license keys' });
  }
});

// List license keys
router.get('/keys', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, used } = req.query;
    const query = {};
    
    if (used !== undefined) {
      query.used = used === 'true';
    }
    
    const keys = await LicenseKey
      .find(query)
      .populate('usedBy', 'email name')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await LicenseKey.countDocuments(query);
    
    res.json({
      success: true,
      keys,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching keys' });
  }
});

// List users
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const users = await User
      .find()
      .select('-password')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await User.countDocuments();
    
    res.json({
      success: true,
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching users' });
  }
});

// Update user
router.put('/users/:userId', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { points, subscription, isActive } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (points !== undefined) user.points = points;
    if (subscription) user.subscription = { ...user.subscription, ...subscription };
    if (isActive !== undefined) user.isActive = isActive;
    
    await user.save();
    
    res.json({
      success: true,
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({ error: 'Error updating user' });
  }
});

// Ban user
router.post('/users/:userId/ban', adminAuth, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.userId, { isActive: false });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, message: 'User banned' });
  } catch (error) {
    res.status(500).json({ error: 'Error banning user' });
  }
});

// Unban user
router.post('/users/:userId/unban', adminAuth, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.userId, { isActive: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, message: 'User unbanned' });
  } catch (error) {
    res.status(500).json({ error: 'Error unbanning user' });
  }
});

// Add or minus points
router.post('/users/:userId/points', adminAuth, async (req, res) => {
  try {
    const { action, amount } = req.body;
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (action === 'add') {
      user.points += Math.abs(amount);
    } else if (action === 'minus') {
      user.points -= Math.abs(amount);
      if (user.points < 0) user.points = 0;
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }

    await user.save();
    res.json({ success: true, points: user.points });
  } catch (error) {
    res.status(500).json({ error: 'Error updating points' });
  }
});

// Initialize default plans
router.post('/plans/init', adminAuth, async (req, res) => {
  try {
    const defaultPlans = [
      {
        name: 'free',
        displayName: 'Free Plan',
        features: {
          messagesPerDay: 50,
          messagesPerMonth: 500,
          groupsPerDay: 5,
          contactsLimit: 100,
          autoReplyEnabled: false,
          analyticsEnabled: false,
          prioritySupport: false,
          apiAccess: false,
          customBranding: false
        },
        pricing: {
          monthly: 0,
          yearly: 0,
          pointsIncluded: 0
        },
        pointCosts: {
          sendMessage: 1,
          addMember: 2,
          extractMember: 1,
          validateNumber: 0.5,
          extractChatNumbers: 1,
          autoReply: 1
        }
      },
      {
        name: 'basic',
        displayName: 'Basic Plan',
        features: {
          messagesPerDay: 500,
          messagesPerMonth: 10000,
          groupsPerDay: 50,
          contactsLimit: 1000,
          autoReplyEnabled: true,
          analyticsEnabled: true,
          prioritySupport: false,
          apiAccess: false,
          customBranding: false
        },
        pricing: {
          monthly: 19.99,
          yearly: 199.99,
          pointsIncluded: 500
        },
        pointCosts: {
          sendMessage: 0.8,
          addMember: 1.5,
          extractMember: 0.8,
          validateNumber: 0.3,
          extractChatNumbers: 1,
          autoReply: 1
        }
      },
      {
        name: 'pro',
        displayName: 'Pro Plan',
        features: {
          messagesPerDay: 2000,
          messagesPerMonth: 50000,
          groupsPerDay: 200,
          contactsLimit: 10000,
          autoReplyEnabled: true,
          analyticsEnabled: true,
          prioritySupport: true,
          apiAccess: true,
          customBranding: false
        },
        pricing: {
          monthly: 49.99,
          yearly: 499.99,
          pointsIncluded: 2000
        },
        pointCosts: {
          sendMessage: 0.5,
          addMember: 1,
          extractMember: 0.5,
          validateNumber: 0.2,
          extractChatNumbers: 1,
          autoReply: 1
        }
      },
      {
        name: 'enterprise',
        displayName: 'Enterprise Plan',
        features: {
          messagesPerDay: 10000,
          messagesPerMonth: 300000,
          groupsPerDay: 1000,
          contactsLimit: 100000,
          autoReplyEnabled: true,
          analyticsEnabled: true,
          prioritySupport: true,
          apiAccess: true,
          customBranding: true
        },
        pricing: {
          monthly: 199.99,
          yearly: 1999.99,
          pointsIncluded: 10000
        },
        pointCosts: {
          sendMessage: 0.3,
          addMember: 0.5,
          extractMember: 0.3,
          validateNumber: 0.1,
          extractChatNumbers: 1,
          autoReply: 1
        }
      }
    ];
    
    // Clear existing plans
    await Plan.deleteMany({});
    
    // Insert new plans
    const plans = await Plan.insertMany(defaultPlans);
    
    res.json({
      success: true,
      message: 'Plans initialized successfully',
      plans
    });
  } catch (error) {
    console.error('Init plans error:', error);
    res.status(500).json({ error: 'Error initializing plans' });
  }
});

// Update point costs for a plan
router.put('/plans/:planName/point-costs', adminAuth, async (req, res) => {
  try {
    const { planName } = req.params;
    const { pointCosts } = req.body;
    if (!pointCosts || typeof pointCosts !== 'object') {
      return res.status(400).json({ error: 'pointCosts object is required' });
    }
    const plan = await Plan.findOne({ name: planName });
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    plan.pointCosts = { ...plan.pointCosts, ...pointCosts };
    await plan.save();
    res.json({ success: true, message: 'Point costs updated', plan });
  } catch (error) {
    console.error('Error updating point costs:', error);
    res.status(500).json({ error: 'Error updating point costs' });
  }
});

// List all plans (admin only)
router.get('/plans', adminAuth, async (req, res) => {
  try {
    const plans = await Plan.find();
    res.json({ success: true, plans });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching plans' });
  }
});

=======
const express = require('express');
const crypto = require('crypto');
const User = require('../models/User');
const LicenseKey = require('../models/LicenseKey');
const Plan = require('../models/Plan');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// Generate random license key
const generateLicenseKey = () => {
  return `WA-${crypto.randomBytes(4).toString('hex').toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
};

// Get dashboard stats
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const paidUsers = await User.countDocuments({ 'subscription.plan': { $ne: 'free' } });
    
    const totalKeys = await LicenseKey.countDocuments();
    const usedKeys = await LicenseKey.countDocuments({ used: true });
    
    // Calculate revenue (simplified)
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const monthlyUsers = await User.countDocuments({
      'subscription.plan': { $ne: 'free' },
      'subscription.expiresAt': { $gte: thisMonth }
    });
    
    res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        paidUsers,
        totalKeys,
        usedKeys,
        availableKeys: totalKeys - usedKeys,
        estimatedMRR: monthlyUsers * 20 // Simplified calculation
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching stats' });
  }
});

// Create license keys
router.post('/keys/generate', adminAuth, async (req, res) => {
  try {
    const { 
      type = 'points',
      points = 0,
      plan,
      duration = 30,
      quantity = 1,
      expiresIn = 90,
      notes
    } = req.body;
    
    const keys = [];
    
    for (let i = 0; i < quantity; i++) {
      const keyData = {
        key: generateLicenseKey(),
        type,
        points,
        notes
      };
      
      if (type === 'subscription' || type === 'both') {
        keyData.subscription = { plan, duration };
      }
      
      if (expiresIn > 0) {
        keyData.expiresAt = new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000);
      }
      
      const licenseKey = new LicenseKey(keyData);
      await licenseKey.save();
      keys.push(licenseKey);
    }
    
    res.json({
      success: true,
      message: `Generated ${quantity} license key(s)`,
      keys: keys.map(k => ({
        key: k.key,
        type: k.type,
        points: k.points,
        plan: k.subscription?.plan,
        expiresAt: k.expiresAt
      }))
    });
  } catch (error) {
    console.error('Generate keys error:', error);
    res.status(500).json({ error: 'Error generating license keys' });
  }
});

// List license keys
router.get('/keys', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, used } = req.query;
    const query = {};
    
    if (used !== undefined) {
      query.used = used === 'true';
    }
    
    const keys = await LicenseKey
      .find(query)
      .populate('usedBy', 'email name')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await LicenseKey.countDocuments(query);
    
    res.json({
      success: true,
      keys,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching keys' });
  }
});

// List users
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const users = await User
      .find()
      .select('-password')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await User.countDocuments();
    
    res.json({
      success: true,
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching users' });
  }
});

// Update user
router.put('/users/:userId', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { points, subscription, isActive } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (points !== undefined) user.points = points;
    if (subscription) user.subscription = { ...user.subscription, ...subscription };
    if (isActive !== undefined) user.isActive = isActive;
    
    await user.save();
    
    res.json({
      success: true,
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({ error: 'Error updating user' });
  }
});

// Ban user
router.post('/users/:userId/ban', adminAuth, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.userId, { isActive: false });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, message: 'User banned' });
  } catch (error) {
    res.status(500).json({ error: 'Error banning user' });
  }
});

// Unban user
router.post('/users/:userId/unban', adminAuth, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.userId, { isActive: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, message: 'User unbanned' });
  } catch (error) {
    res.status(500).json({ error: 'Error unbanning user' });
  }
});

// Add or minus points
router.post('/users/:userId/points', adminAuth, async (req, res) => {
  try {
    const { action, amount } = req.body;
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (action === 'add') {
      user.points += Math.abs(amount);
    } else if (action === 'minus') {
      user.points -= Math.abs(amount);
      if (user.points < 0) user.points = 0;
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }

    await user.save();
    res.json({ success: true, points: user.points });
  } catch (error) {
    res.status(500).json({ error: 'Error updating points' });
  }
});

// Initialize default plans
router.post('/plans/init', adminAuth, async (req, res) => {
  try {
    const defaultPlans = [
      {
        name: 'free',
        displayName: 'Free Plan',
        features: {
          messagesPerDay: 50,
          messagesPerMonth: 500,
          groupsPerDay: 5,
          contactsLimit: 100,
          autoReplyEnabled: false,
          analyticsEnabled: false,
          prioritySupport: false,
          apiAccess: false,
          customBranding: false
        },
        pricing: {
          monthly: 0,
          yearly: 0,
          pointsIncluded: 0
        },
        pointCosts: {
          sendMessage: 1,
          addMember: 2,
          extractMember: 1,
          validateNumber: 0.5,
          extractChatNumbers: 1,
          autoReply: 1
        }
      },
      {
        name: 'basic',
        displayName: 'Basic Plan',
        features: {
          messagesPerDay: 500,
          messagesPerMonth: 10000,
          groupsPerDay: 50,
          contactsLimit: 1000,
          autoReplyEnabled: true,
          analyticsEnabled: true,
          prioritySupport: false,
          apiAccess: false,
          customBranding: false
        },
        pricing: {
          monthly: 19.99,
          yearly: 199.99,
          pointsIncluded: 500
        },
        pointCosts: {
          sendMessage: 0.8,
          addMember: 1.5,
          extractMember: 0.8,
          validateNumber: 0.3,
          extractChatNumbers: 1,
          autoReply: 1
        }
      },
      {
        name: 'pro',
        displayName: 'Pro Plan',
        features: {
          messagesPerDay: 2000,
          messagesPerMonth: 50000,
          groupsPerDay: 200,
          contactsLimit: 10000,
          autoReplyEnabled: true,
          analyticsEnabled: true,
          prioritySupport: true,
          apiAccess: true,
          customBranding: false
        },
        pricing: {
          monthly: 49.99,
          yearly: 499.99,
          pointsIncluded: 2000
        },
        pointCosts: {
          sendMessage: 0.5,
          addMember: 1,
          extractMember: 0.5,
          validateNumber: 0.2,
          extractChatNumbers: 1,
          autoReply: 1
        }
      },
      {
        name: 'enterprise',
        displayName: 'Enterprise Plan',
        features: {
          messagesPerDay: 10000,
          messagesPerMonth: 300000,
          groupsPerDay: 1000,
          contactsLimit: 100000,
          autoReplyEnabled: true,
          analyticsEnabled: true,
          prioritySupport: true,
          apiAccess: true,
          customBranding: true
        },
        pricing: {
          monthly: 199.99,
          yearly: 1999.99,
          pointsIncluded: 10000
        },
        pointCosts: {
          sendMessage: 0.3,
          addMember: 0.5,
          extractMember: 0.3,
          validateNumber: 0.1,
          extractChatNumbers: 1,
          autoReply: 1
        }
      }
    ];
    
    // Clear existing plans
    await Plan.deleteMany({});
    
    // Insert new plans
    const plans = await Plan.insertMany(defaultPlans);
    
    res.json({
      success: true,
      message: 'Plans initialized successfully',
      plans
    });
  } catch (error) {
    console.error('Init plans error:', error);
    res.status(500).json({ error: 'Error initializing plans' });
  }
});

// Update point costs for a plan
router.put('/plans/:planName/point-costs', adminAuth, async (req, res) => {
  try {
    const { planName } = req.params;
    const { pointCosts } = req.body;
    if (!pointCosts || typeof pointCosts !== 'object') {
      return res.status(400).json({ error: 'pointCosts object is required' });
    }
    const plan = await Plan.findOne({ name: planName });
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    plan.pointCosts = { ...plan.pointCosts, ...pointCosts };
    await plan.save();
    res.json({ success: true, message: 'Point costs updated', plan });
  } catch (error) {
    console.error('Error updating point costs:', error);
    res.status(500).json({ error: 'Error updating point costs' });
  }
});

// List all plans (admin only)
router.get('/plans', adminAuth, async (req, res) => {
  try {
    const plans = await Plan.find();
    res.json({ success: true, plans });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching plans' });
  }
});

>>>>>>> c748219ba1adc3796d601867ddd17133d2a092e1
module.exports = router;