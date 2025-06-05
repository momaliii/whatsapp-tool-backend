const express = require('express');
const axios = require('axios');
const User = require('../models/User');
const router = express.Router();

// In production, use process.env for these keys!
const FAWATERAK_API_KEY = 'af864762b794dbdc62cda431e28318da9c907401dfcd6d27f';
const FAWATERAK_PROVIDER_KEY = 'FAWATERAK.22161';

// Create a Fawaterak payment link (invoice)
router.post('/create-payment', async (req, res) => {
  const { amount, userId, userEmail } = req.body;

  try {
    const response = await axios.post(
      'https://api.fawaterak.com/v1.0/invoice/create',
      {
        amount,
        currency: 'EGP',
        customer: {
          email: userEmail,
        },
        provider_key: FAWATERAK_PROVIDER_KEY,
        callback_url: 'https://whatsapp-tool-backend.onrender.com/api/payments/webhook',
        metadata: { userId }
      },
      {
        headers: {
          Authorization: `Bearer ${FAWATERAK_API_KEY}`,
        },
      }
    );

    res.json({ success: true, payment_url: response.data.data.url });
  } catch (error) {
    console.error('Fawaterak error:', error.response?.data || error.message);
    res.status(500).json({ success: false, error: 'Failed to create payment link' });
  }
});

// Fawaterak webhook to auto-credit points after payment
router.post('/webhook', async (req, res) => {
  const { status, metadata, amount_paid } = req.body;

  if (status === 'paid' && metadata && metadata.userId) {
    try {
      // Example: 1 EGP = 1 point (customize as needed)
      await User.findByIdAndUpdate(metadata.userId, { $inc: { points: amount_paid } });
      console.log(`User ${metadata.userId} paid ${amount_paid} EGP. Credited points.`);
    } catch (err) {
      console.error('Error crediting user:', err);
    }
  }

  res.sendStatus(200);
});

module.exports = router; 