require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/database');
const { adminAuth } = require('./middleware/auth');
const session = require('express-session');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const OpenAI = require('openai');
const AiAgentSettings = require('./models/AiAgentSettings');
const multer = require('multer');
const fs = require('fs');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Connect to database
connectDB().catch(err => {
  console.error('Failed to connect to database:', err);
  process.exit(1);
});

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session configuration
const sessionConfig = {
  secret: process.env.ADMIN_SESSION_SECRET || 'supersecret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
};

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
  sessionConfig.cookie.secure = true;
}

app.use(session(sessionConfig));

// Admin session middleware
function requireAdminSession(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  res.status(401).sendFile(path.join(__dirname, 'admin-login.html'));
}

// Admin login route
app.post('/admin/login', express.json(), async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }
    
    if (password === process.env.ADMIN_PASSWORD) {
      req.session.isAdmin = true;
      return res.json({ success: true });
    }
    res.status(401).json({ error: 'Invalid password' });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- AI Agent Settings & OpenAI Integration ---
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Save AI Agent settings (persistent, upsert)
app.post('/api/ai-agent-settings', async (req, res) => {
  try {
    await AiAgentSettings.findOneAndUpdate(
      {},
      { enabled: req.body.enabled, prompt: req.body.prompt },
      { new: true, upsert: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save settings.' });
  }
});

// Load AI Agent settings (persistent)
app.get('/api/ai-agent-settings', async (req, res) => {
  try {
    let settings = await AiAgentSettings.findOne();
    if (!settings) settings = new AiAgentSettings();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load settings.' });
  }
});

// Endpoint to get AI reply (for testing, persistent)
app.post('/api/ai-agent-reply', async (req, res) => {
  const { message } = req.body;
  try {
    const settings = await AiAgentSettings.findOne();
    if (!settings || !settings.enabled || !settings.prompt) {
      return res.status(400).json({ error: 'AI Agent is not enabled or prompt is missing.' });
    }
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: settings.prompt },
        { role: 'user', content: message }
      ]
    });
    const aiReply = response.choices[0].message.content;
    res.json({ reply: aiReply });
  } catch (err) {
    // --- BEGIN DETAILED ERROR LOGGING ---
    console.error('--- AI Agent Error Details ---');
    console.error('Incoming message:', message);
    try {
      const settings = await AiAgentSettings.findOne();
      console.error('AI Agent settings:', settings);
    } catch (settingsErr) {
      console.error('Failed to fetch AI Agent settings for error log:', settingsErr);
    }
    if (err.response) {
      // OpenAI API error with response
      console.error('OpenAI API error response:', err.response.data);
    }
    console.error('Full error object:', err);
    if (err.stack) {
      console.error('Error stack:', err.stack);
    }
    console.error('--- END AI Agent Error Details ---');
    // --- END DETAILED ERROR LOGGING ---
    res.status(500).json({ error: 'Failed to get AI reply.' });
  }
});

// Multer setup for AI Agent knowledge files
const knowledgeUploadDir = path.join(__dirname, 'uploads', 'ai-knowledge');
if (!fs.existsSync(knowledgeUploadDir)) fs.mkdirSync(knowledgeUploadDir, { recursive: true });
const knowledgeStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, knowledgeUploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + '-' + file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_'));
  }
});
const knowledgeUpload = multer({ storage: knowledgeStorage });

// Upload endpoint for AI Agent knowledge files
app.post('/api/ai-agent-knowledge-upload', knowledgeUpload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded.' });
    }
    const filesMeta = req.files.map(f => ({
      filename: f.filename,
      originalname: f.originalname,
      mimetype: f.mimetype,
      size: f.size,
      uploadedAt: new Date()
    }));
    // Update the AiAgentSettings document (append to knowledgeFiles)
    const settings = await AiAgentSettings.findOneAndUpdate(
      {},
      { $push: { knowledgeFiles: { $each: filesMeta } } },
      { new: true, upsert: true }
    );
    res.json({ success: true, files: settings.knowledgeFiles });
  } catch (err) {
    console.error('AI Agent knowledge file upload error:', err);
    res.status(500).json({ error: 'Failed to upload knowledge files.' });
  }
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/points', require('./routes/points'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/wa-accounts', require('./routes/wa-accounts'));
app.use('/api/payment', require('./routes/payment-routes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Serve admin dashboard
app.get('/admin', requireAdminSession, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin-dashboard.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});