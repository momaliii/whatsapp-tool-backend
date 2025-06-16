const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  plan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'expired', 'pending'],
    default: 'pending'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly'],
    required: true
  },
  autoRenew: {
    type: Boolean,
    default: true
  },
  paymentMethod: {
    type: {
      type: String,
      enum: ['credit_card', 'paypal', 'bank_transfer'],
      required: true
    },
    lastFour: String,
    expiryDate: Date,
    cardholderName: String
  },
  billingHistory: [{
    amount: Number,
    currency: String,
    date: Date,
    status: String,
    invoiceId: String
  }],
  usage: {
    messagesUsed: { type: Number, default: 0 },
    groupsUsed: { type: Number, default: 0 },
    contactsUsed: { type: Number, default: 0 },
    lastReset: { type: Date, default: Date.now }
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
  cancellationReason: String,
  trialEndsAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
subscriptionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Method to check if subscription is active
subscriptionSchema.methods.isActive = function() {
  return this.status === 'active' && new Date() < this.endDate;
};

// Method to check if subscription is in trial
subscriptionSchema.methods.isInTrial = function() {
  return this.trialEndsAt && new Date() < this.trialEndsAt;
};

// Method to reset usage counters
subscriptionSchema.methods.resetUsage = function() {
  const now = new Date();
  const lastReset = new Date(this.usage.lastReset);
  
  if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
    this.usage.messagesUsed = 0;
    this.usage.groupsUsed = 0;
    this.usage.contactsUsed = 0;
    this.usage.lastReset = now;
    return true;
  }
  return false;
};

module.exports = mongoose.model('Subscription', subscriptionSchema); 