const mongoose = require('mongoose');

const pointsPurchaseSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  package: { type: mongoose.Schema.Types.ObjectId, ref: 'PointsPackage', required: true },
  points: { type: Number, required: true },
  price: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'completed' },
  purchasedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PointsPurchase', pointsPurchaseSchema); 