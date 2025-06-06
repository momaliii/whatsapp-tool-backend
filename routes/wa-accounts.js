const express = require('express');
const User = require('../models/User');
const router = express.Router();
const authenticate = require('../middleware/authenticate');

// List WhatsApp accounts
router.get('/', authenticate, async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ success: true, accounts: user.whatsappAccounts || [] });
});

// Add WhatsApp account (placeholder, actual QR/session logic needed)
router.post('/add', authenticate, async (req, res) => {
  // Here you would start a new WhatsApp session and return a QR code
  // For now, just add a placeholder account
  const { phoneNumber, displayName } = req.body;
  const user = await User.findById(req.user._id);
  user.whatsappAccounts.push({ phoneNumber, displayName, status: 'offline' });
  await user.save();
  res.json({ success: true, accounts: user.whatsappAccounts });
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