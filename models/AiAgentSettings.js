const mongoose = require('mongoose');

const AiAgentSettingsSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: false },
    prompt: { type: String, default: '' },
    knowledgeFiles: [
      {
        originalname: String, // original uploaded name
        mimetype: String,
        size: Number,
        content: String, // file content stored directly
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    googleSheets: [
      {
        name: String,
        url: String,
        sheetId: String,
        range: { type: String, default: 'A1:Z1000' },
        lastSync: { type: Date, default: Date.now },
        data: String, // Store sheet data as JSON string
      },
    ],
  },
  { collection: 'ai_agent_settings' }
);

module.exports = mongoose.model('AiAgentSettings', AiAgentSettingsSchema);
