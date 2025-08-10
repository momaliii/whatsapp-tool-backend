const mongoose = require('mongoose');

const pointsPackageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  points: { type: Number, required: true },
  price: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  customLink: { type: String },
  popular: { type: Boolean, default: false },
});

module.exports = mongoose.model('PointsPackage', pointsPackageSchema);
