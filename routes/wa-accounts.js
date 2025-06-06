const express = require('express');
const User = require('../models/User');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { Client, LocalAuth } = require('whatsapp-web.js');

// List WhatsApp accounts
router.get('/', authenticate, async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ success: true, accounts: user.whatsappAccounts || [] });
});

// Add WhatsApp account with QR code generation
router.post('/add', authenticate, async (req, res) => {
  const { phoneNumber, displayName } = req.body;
  const user = await User.findById(req.user._id);
  // Start a new WhatsApp session and generate QR code
  const client = new Client({
    authStrategy: new LocalAuth({ clientId: phoneNumber }),
    puppeteer: { headless: true }
  });
  client.on('qr', async (qr) => {
    // Store the QR code in the account
    const newAccount = { phoneNumber, displayName, status: 'pending', qr };
    user.whatsappAccounts.push(newAccount);
    await user.save();
    res.json({ success: true, qr, accountId: newAccount._id });
  });
  client.on('ready', async () => {
    // Update account status to authenticated
    const account = user.whatsappAccounts.find(acc => acc.phoneNumber === phoneNumber);
    if (account) {
      account.status = 'authenticated';
      await user.save();
    }
  });
  client.initialize();
});

// Check WhatsApp account session status
router.get('/status', authenticate, async (req, res) => {
  const { accountId } = req.query;
  const user = await User.findById(req.user._id);
  const account = user.whatsappAccounts.find(acc => acc._id.toString() === accountId);
  if (!account) {
    return res.status(404).json({ success: false, message: 'Account not found' });
  }
  res.json({ success: true, status: account.status });
});

// Switch active WhatsApp account
router.post('/switch', authenticate, async (req, res) => {
  const { accountId } = req.body;
  // You can store the active account in the user profile or session
  req.session.activeWaAccount = accountId;
  res.json({ success: true, active: accountId });
});

// Remove WhatsApp account
router.post('/remove', authenticate, async (req, res) => {
  const { accountId } = req.body;
  const user = await User.findById(req.user._id);
  user.whatsappAccounts = user.whatsappAccounts.filter(acc => acc._id.toString() !== accountId);
  await user.save();
  res.json({ success: true, accounts: user.whatsappAccounts });
});

module.exports = router; 