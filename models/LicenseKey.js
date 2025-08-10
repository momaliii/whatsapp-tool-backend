const mongoose = require('mongoose');

const licenseKeySchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
  },
  type: {
    type: String,
    enum: ['points', 'subscription', 'both'],
    required: true,
  },
  points: {
    type: Number,
    default: 0,
  },
  subscription: {
    plan: {
      type: String,
      enum: ['basic', 'pro', 'enterprise'],
    },
    duration: Number, // days
  },
  used: {
    type: Boolean,
    default: false,
  },
  usedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  usedAt: Date,
  createdBy: {
    type: String,
    default: 'admin',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: Date,
  notes: String,
});

module.exports = mongoose.model('LicenseKey', licenseKeySchema);
