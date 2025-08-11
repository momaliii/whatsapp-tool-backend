const mongoose = require('mongoose');

const TutorialVideoSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    url: { type: String, required: true, trim: true },
    category: { type: String, default: 'general', index: true },
    order: { type: Number, default: 0, index: true },
    isPublished: { type: Boolean, default: true },
    thumbnailUrl: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('TutorialVideo', TutorialVideoSchema);


