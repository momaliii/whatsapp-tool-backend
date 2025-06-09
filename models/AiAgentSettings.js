const mongoose = require('mongoose');

const AiAgentSettingsSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: false },
  prompt: { type: String, default: '' },
  knowledgeFiles: [
    {
      filename: String, // stored filename on server
      originalname: String, // original uploaded name
      mimetype: String,
      size: Number,
      uploadedAt: { type: Date, default: Date.now }
    }
  ]
}, { collection: 'ai_agent_settings' });

module.exports = mongoose.model('AiAgentSettings', AiAgentSettingsSchema); 