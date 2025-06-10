const mongoose = require('mongoose');

const AiAgentSettingsSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: false },
  prompt: { type: String, default: '' },
  knowledgeFiles: [
    {
      originalname: String, // original uploaded name
      mimetype: String,
      size: Number,
      content: String, // file content stored directly
      uploadedAt: { type: Date, default: Date.now }
    }
  ]
}, { collection: 'ai_agent_settings' });

module.exports = mongoose.model('AiAgentSettings', AiAgentSettingsSchema); 