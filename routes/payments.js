const express = require('express');
const axios = require('axios');
const User = require('../models/User');
const Payment = require('../models/Payment');
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

    // Save payment record (pending)
    await Payment.create({
      userId,
      amount,
      status: 'pending',
      invoiceId: response.data.data.invoice_id,
      paymentUrl: response.data.data.url,
      createdAt: new Date()
    });

    res.json({ success: true, payment_url: response.data.data.url, invoice_id: response.data.data.invoice_id });
  } catch (error) {
    console.error('Fawaterak error:', error.response?.data || error.message);
    res.status(500).json({ success: false, error: 'Failed to create payment link' });
  }
});

// Payment webhook
router.post('/webhook', async (req, res) => {
  const { status, metadata, amount_paid, invoice_id } = req.body;

  if (invoice_id) {
    await Payment.findOneAndUpdate({ invoiceId: invoice_id }, { status, amountPaid: amount_paid, updatedAt: new Date() });
  }

  if (status === 'paid' && metadata && metadata.userId) {
    try {
      await User.findByIdAndUpdate(metadata.userId, { $inc: { points: amount_paid } });
      console.log(`User ${metadata.userId} paid ${amount_paid} EGP. Credited points.`);
    } catch (err) {
      console.error('Error crediting user:', err);
    }
  }

  res.sendStatus(200);
});

// Get payment history for a user
router.get('/history/:userId', async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json({ success: true, payments });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch payment history' });
  }
});

module.exports = router; 