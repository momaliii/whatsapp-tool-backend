const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['system', 'user', 'assistant'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ConversationSchema = new mongoose.Schema(
  {
    contactId: { type: String, required: true, index: true },
    messages: { type: [MessageSchema], default: [] },
  },
  { timestamps: true, collection: 'conversations' }
);

module.exports = mongoose.model('Conversation', ConversationSchema);


