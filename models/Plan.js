<<<<<<< HEAD
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
    sendMessage: { type: Number, default: 0.5 },
    addMember: { type: Number, default: 1 },
    extractMember: { type: Number, default: 0.5 },
    validateNumber: { type: Number, default: 0.2 },
    extractChatNumbers: { type: Number, default: 0.5 },
    autoReply: { type: Number, default: 0.5 }
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

=======
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
    sendMessage: { type: Number, default: 0.5 },
    addMember: { type: Number, default: 1 },
    extractMember: { type: Number, default: 0.5 },
    validateNumber: { type: Number, default: 0.2 },
    extractChatNumbers: { type: Number, default: 0.5 },
    autoReply: { type: Number, default: 0.5 }
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

>>>>>>> c748219ba1adc3796d601867ddd17133d2a092e1
module.exports = mongoose.model('Plan', planSchema);