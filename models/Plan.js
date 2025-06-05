const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  displayName: {
    type: String,
    required: true
  },
  features: {
    messagesPerDay: Number,
    messagesPerMonth: Number,
    groupsPerDay: Number,
    contactsLimit: Number,
    autoReplyEnabled: Boolean,
    analyticsEnabled: Boolean,
    prioritySupport: Boolean,
    apiAccess: Boolean,
    customBranding: Boolean
  },
  pricing: {
    monthly: Number,
    yearly: Number,
    pointsIncluded: Number
  },
  pointCosts: {
    sendMessage: { type: Number, default: 1 },
    addMember: { type: Number, default: 2 },
    extractMember: { type: Number, default: 1 },
    validateNumber: { type: Number, default: 0.5 },
    extractChatNumbers: { type: Number, default: 1 },
    autoReply: { type: Number, default: 1 }
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

module.exports = mongoose.model('Plan', planSchema);