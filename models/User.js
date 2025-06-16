const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  points: {
    type: Number,
    default: 500 // Welcome bonus
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'pro', 'enterprise'],
      default: 'free'
    },
    expiresAt: Date,
    autoRenew: {
      type: Boolean,
      default: false
    }
  },
  usage: {
    messagesTotal: { type: Number, default: 0 },
    messagesThisMonth: { type: Number, default: 0 },
    groupsAdded: { type: Number, default: 0 },
    extractedMembers: { type: Number, default: 0 },
    validatedNumbers: { type: Number, default: 0 },
    lastReset: { type: Date, default: Date.now }
  },
  whatsappAccounts: [
    {
      phoneNumber: String,
      sessionData: mongoose.Schema.Types.Mixed, // or sessionFile: String if storing as files
      status: { type: String, enum: ['online', 'offline'], default: 'offline' },
      displayName: String,
      createdAt: { type: Date, default: Date.now }
    }
  ]
});

// Update the updatedAt timestamp before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Reset monthly usage
userSchema.methods.resetMonthlyUsage = function() {
  const now = new Date();
  const lastReset = new Date(this.usage.lastReset);
  
  if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
    this.usage.messagesThisMonth = 0;
    this.usage.lastReset = now;
    return true;
  }
  return false;
};

const User = mongoose.model('User', userSchema);

module.exports = User;