require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/database');
const { adminAuth } = require('./middleware/auth');
const session = require('express-session');

const app = express();

// Connect to database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

app.use(session({
  secret: process.env.ADMIN_SESSION_SECRET || 'supersecret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

function requireAdminSession(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  res.status(401).sendFile(path.join(__dirname, 'admin-login.html'));
}

app.post('/admin/login', express.json(), (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    return res.json({ success: true });
  }
  res.status(401).json({ error: 'Invalid password' });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/points', require('./routes/points'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/wa-accounts', require('./routes/wa-accounts'));
app.use('/api/payment', require('./routes/payment-routes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Serve admin dashboard
app.get('/admin', requireAdminSession, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin-dashboard.html'));
});