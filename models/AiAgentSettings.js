const mongoose = require('mongoose');

const AiAgentSettingsSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: false },
  prompt: { type: String, default: '' }
}, { collection: 'ai_agent_settings' });

module.exports = mongoose.model('AiAgentSettings', AiAgentSettingsSchema); 