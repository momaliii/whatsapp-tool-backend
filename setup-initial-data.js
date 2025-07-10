require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Plan = require('./models/Plan');
const PointsPackage = require('./models/PointsPackage');
const AiAgentSettings = require('./models/AiAgentSettings');

const setupInitialData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Create default plans
    const plans = [
      {
        name: 'basic',
        displayName: 'Basic Plan',
        features: {
          messagesPerDay: 100,
          messagesPerMonth: 3000,
          groupsPerDay: 2,
          contactsLimit: 100,
          autoReplyEnabled: false,
          analyticsEnabled: false,
          prioritySupport: false,
          apiAccess: false,
          customBranding: false
        },
        pricing: {
          monthly: 9.99,
          yearly: 99.99,
          pointsIncluded: 100
        },
        pointCosts: {
          sendMessage: 0.5,
          addMember: 1,
          extractMember: 0.5,
          validateNumber: 0.2,
          extractChatNumbers: 0.5,
          autoReply: 0.5
        },
        isActive: true
      },
      {
        name: 'pro',
        displayName: 'Pro Plan',
        features: {
          messagesPerDay: 500,
          messagesPerMonth: 15000,
          groupsPerDay: 5,
          contactsLimit: 500,
          autoReplyEnabled: true,
          analyticsEnabled: true,
          prioritySupport: true,
          apiAccess: false,
          customBranding: false
        },
        pricing: {
          monthly: 19.99,
          yearly: 199.99,
          pointsIncluded: 500
        },
        pointCosts: {
          sendMessage: 0.4,
          addMember: 0.8,
          extractMember: 0.4,
          validateNumber: 0.15,
          extractChatNumbers: 0.4,
          autoReply: 0.4
        },
        isActive: true
      },
      {
        name: 'enterprise',
        displayName: 'Enterprise Plan',
        features: {
          messagesPerDay: -1, // unlimited
          messagesPerMonth: -1, // unlimited
          groupsPerDay: -1, // unlimited
          contactsLimit: -1, // unlimited
          autoReplyEnabled: true,
          analyticsEnabled: true,
          prioritySupport: true,
          apiAccess: true,
          customBranding: true
        },
        pricing: {
          monthly: 49.99,
          yearly: 499.99,
          pointsIncluded: 2000
        },
        pointCosts: {
          sendMessage: 0.3,
          addMember: 0.6,
          extractMember: 0.3,
          validateNumber: 0.1,
          extractChatNumbers: 0.3,
          autoReply: 0.3
        },
        isActive: true
      }
    ];

    await Plan.insertMany(plans);
    console.log('Default plans created');

    // Create points packages
    const pointsPackages = [
      {
        name: 'Starter Pack',
        points: 100,
        price: 4.99,
        isActive: true
      },
      {
        name: 'Business Pack',
        points: 500,
        price: 19.99,
        isActive: true
      },
      {
        name: 'Enterprise Pack',
        points: 2000,
        price: 69.99,
        isActive: true
      }
    ];

    await PointsPackage.insertMany(pointsPackages);
    console.log('Points packages created');

    // Create default AI agent settings
    const aiSettings = new AiAgentSettings({
      enabled: true,
      prompt: 'You are a helpful WhatsApp assistant. Be professional and concise in your responses.',
      googleSheets: []
    });

    await aiSettings.save();
    console.log('AI agent settings created');

    // Create admin user if not exists
    const adminExists = await User.findOne({ email: 'admin@whatsapptool.com' });
    if (!adminExists) {
      const adminUser = new User({
        email: 'admin@whatsapptool.com',
        password: process.env.ADMIN_PASSWORD || 'admin123', // Make sure to change this
        name: 'Admin',
        role: 'admin',
        isActive: true
      });
      await adminUser.save();
      console.log('Admin user created');
    }

    console.log('Initial setup completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error setting up initial data:', error);
    process.exit(1);
  }
};

setupInitialData(); 