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
const Conversation = require('./models/Conversation');
const multer = require('multer');
const fs = require('fs');
const { google } = require('googleapis');

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

// Google Sheets API configuration
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY; // Add this to your .env file

// Function to extract sheet ID from Google Sheets URL
function extractSheetId(url) {
  try {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  } catch (e) {
    return null;
  }
}

// Function to fetch sheet data
async function fetchSheetData(sheetId, range = 'A1:Z1000') {
  try {
    if (!GOOGLE_API_KEY) {
      throw new Error('Google API key not configured');
    }

    const sheets = google.sheets({ 
      version: 'v4',
      auth: GOOGLE_API_KEY
    });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: range,
    });
    return response.data.values;
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    throw error;
  }
}

// Endpoint to add Google Sheet
app.post('/api/ai-agent-sheets', async (req, res) => {
  try {
    const { name, url, range } = req.body;
    if (!url) {
      const settings = await AiAgentSettings.findOne();
      return res.json({ success: true, sheets: settings ? settings.googleSheets : [] });
    }

    const sheetId = extractSheetId(url);
    if (!sheetId) {
      const settings = await AiAgentSettings.findOne();
      return res.json({ success: true, sheets: settings ? settings.googleSheets : [] });
    }

    // Check if sheet is publicly accessible
    try {
      await fetchSheetData(sheetId, 'A1');
    } catch (error) {
      const settings = await AiAgentSettings.findOne();
      return res.json({ success: true, sheets: settings ? settings.googleSheets : [] });
    }

    // Fetch sheet data
    const sheetData = await fetchSheetData(sheetId, range);
    
    // Update settings with new sheet
    const settings = await AiAgentSettings.findOneAndUpdate(
      {},
      {
        $push: {
          googleSheets: {
            name: name || 'Untitled Sheet',
            url,
            sheetId,
            range: range || 'A1:Z1000',
            lastSync: new Date(),
            data: JSON.stringify(sheetData)
          }
        }
      },
      { new: true, upsert: true }
    );

    res.json({ success: true, sheets: settings.googleSheets });
  } catch (err) {
    console.error('Google Sheets integration error:', err);
    if (err.message === 'Google API key not configured') {
      const settings = await AiAgentSettings.findOne();
      res.status(500).json({ error: 'Google Sheets integration is not configured on the server.', sheets: settings ? settings.googleSheets : [] });
    } else {
      const settings = await AiAgentSettings.findOne();
      res.status(500).json({ error: 'Failed to add Google Sheet.', sheets: settings ? settings.googleSheets : [] });
    }
  }
});

// Endpoint to delete Google Sheet
app.delete('/api/ai-agent-sheets/:index', async (req, res) => {
  try {
    const index = parseInt(req.params.index);
    if (isNaN(index)) {
      return res.status(400).json({ error: 'Invalid sheet index.' });
    }

    const settings = await AiAgentSettings.findOne();
    if (!settings || !settings.googleSheets || index >= settings.googleSheets.length) {
      return res.status(404).json({ error: 'Sheet not found.' });
    }

    settings.googleSheets.splice(index, 1);
    await settings.save();

    res.json({ success: true, sheets: settings.googleSheets });
  } catch (err) {
    console.error('Google Sheets delete error:', err);
    res.status(500).json({ error: 'Failed to delete Google Sheet.' });
  }
});

// Update the AI reply endpoint to include sheet data
app.post('/api/ai-agent-reply', async (req, res) => {
  const { message, senderId } = req.body;
  try {
    const settings = await AiAgentSettings.findOne();
    if (!settings || !settings.enabled || !settings.prompt) {
      return res.status(400).json({ error: 'AI Agent is not enabled or prompt is missing.' });
    }

    // Read and concatenate all text-based knowledge files
    let knowledgeText = '';
    if (settings.knowledgeFiles && Array.isArray(settings.knowledgeFiles) && settings.knowledgeFiles.length > 0) {
      const allowedExts = ['.txt', '.csv', '.md'];
      for (const file of settings.knowledgeFiles) {
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedExts.includes(ext) && file.content) {
          knowledgeText += `\n--- File: ${file.originalname} ---\n` + file.content + '\n';
          if (knowledgeText.length > 12000) break;
        }
      }
    }

    // Add Google Sheets data
    if (settings.googleSheets && Array.isArray(settings.googleSheets) && settings.googleSheets.length > 0) {
      for (const sheet of settings.googleSheets) {
        try {
          const sheetData = JSON.parse(sheet.data);
          if (sheetData && sheetData.length > 0) {
            knowledgeText += `\n--- Google Sheet: ${sheet.name} ---\n`;
            knowledgeText += sheetData.map(row => row.join('\t')).join('\n');
            knowledgeText += '\n';
            if (knowledgeText.length > 12000) break;
          }
        } catch (e) {
          console.warn('Failed to parse sheet data:', sheet.name, e.message);
        }
      }
    }

    if (knowledgeText.length > 12000) {
      knowledgeText = knowledgeText.slice(0, 12000) + '\n... (truncated)';
    }

    // Compose the system prompt and conversation history
    let systemPrompt = settings.prompt;
    if (knowledgeText) {
      systemPrompt += '\n\nKnowledge Base:\n' + knowledgeText;
    }

    // Fetch last conversation if senderId provided
    let historyMessages = [];
    if (senderId) {
      const convo = await Conversation.findOne({ contactId: senderId });
      if (convo && Array.isArray(convo.messages)) {
        // Limit history tokens roughly by capping messages count/length
        const MAX_HISTORY_CHARS = 8000;
        let total = 0;
        for (let i = convo.messages.length - 1; i >= 0; i--) {
          const m = convo.messages[i];
          const length = (m.content || '').length;
          if (total + length > MAX_HISTORY_CHARS) break;
          historyMessages.unshift({ role: m.role, content: m.content });
          total += length;
        }
      }
    }

    const messagesPayload = [
      { role: 'system', content: systemPrompt },
      ...historyMessages,
      { role: 'user', content: message }
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: messagesPayload
    });
    const aiReply = response.choices[0].message.content;

    // Persist conversation if senderId present
    if (senderId) {
      await Conversation.findOneAndUpdate(
        { contactId: senderId },
        {
          $push: {
            messages: {
              $each: [
                { role: 'user', content: message },
                { role: 'assistant', content: aiReply }
              ]
            }
          }
        },
        { upsert: true, new: true }
      );
    }

    res.json({ reply: aiReply });
  } catch (err) {
    console.error('AI Agent error:', err);
    res.status(500).json({ error: 'Failed to get AI reply.' });
  }
});

// Upload endpoint for AI Agent knowledge files
app.post('/api/ai-agent-knowledge-upload', async (req, res) => {
  try {
    const { files } = req.body;
    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded.' });
    }

    const filesMeta = await Promise.all(files.map(async (file) => {
      const content = file.content;
      return {
        originalname: file.name,
        mimetype: file.type,
        size: content.length,
        content: content,
        uploadedAt: new Date()
      };
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

// Delete endpoint for AI Agent knowledge files
app.delete('/api/ai-agent-knowledge/:index', async (req, res) => {
  try {
    const index = parseInt(req.params.index);
    if (isNaN(index)) {
      return res.status(400).json({ error: 'Invalid file index.' });
    }

    const settings = await AiAgentSettings.findOne();
    if (!settings || !settings.knowledgeFiles || index >= settings.knowledgeFiles.length) {
      return res.status(404).json({ error: 'File not found.' });
    }

    // Remove the file at the specified index
    settings.knowledgeFiles.splice(index, 1);
    await settings.save();

    res.json({ success: true, files: settings.knowledgeFiles });
  } catch (err) {
    console.error('AI Agent knowledge file delete error:', err);
    res.status(500).json({ error: 'Failed to delete knowledge file.' });
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

// Step 1: Start OAuth flow
app.get('/auth/google', (req, res) => {
  const { google } = require('googleapis');
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  const scopes = [
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/spreadsheets.readonly',
    'https://www.googleapis.com/auth/documents.readonly'
  ];
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes
  });
  res.redirect(url);
});

// Step 2: Handle OAuth callback
app.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send('No code provided');
  try {
    const { google } = require('googleapis');
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    const { tokens } = await oauth2Client.getToken(code);
    req.session.tokens = tokens;
    res.send('Google account connected! You can close this window.');
  } catch (err) {
    console.error('OAuth callback error:', err);
    res.status(500).send('Authentication failed');
  }
});