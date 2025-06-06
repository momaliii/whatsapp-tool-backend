// Force clean redeploy: 2024-06-06
const express = require('express');
const router = express.Router();
const axios = require('axios');
const Payment = require('../models/Payment');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Fawaterak API configuration
const FAWATERAK_API_URL = 'https://staging.fawaterk.com/api/v2';
const FAWATERAK_API_TOKEN = 'af864762b794ddbdc62cda431e28318da9c907401dfcd6d27f';

// Get available payment methods
router.get('/methods', async (req, res) => {
  try {
    const response = await axios.get(`${FAWATERAK_API_URL}/getPaymentmethods`, {
      headers: {
        'Authorization': `Bearer ${FAWATERAK_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching payment methods:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch payment methods' });
  }
});

// Initialize payment
router.post('/initiate', auth, async (req, res) => {
  try {
    const {
      paymentMethodId,
      amount,
      points,
      packageName
    } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const paymentData = {
      payment_method_id: paymentMethodId,
      cartTotal: amount.toString(),
      currency: "EGP",
      customer: {
        first_name: user.name.split(' ')[0] || 'User',
        last_name: user.name.split(' ').slice(1).join(' ') || 'Name',
        email: user.email || 'user@example.com',
        phone: user.phone || '01000000000',
        address: 'N/A'
      },
      redirectionUrls: {
        successUrl: `${process.env.FRONTEND_URL || 'https://whatsapp-tool-backend.onrender.com'}/payment/success`,
        failUrl: `${process.env.FRONTEND_URL || 'https://whatsapp-tool-backend.onrender.com'}/payment/fail`,
        pendingUrl: `${process.env.FRONTEND_URL || 'https://whatsapp-tool-backend.onrender.com'}/payment/pending`
      },
      cartItems: [
        {
          name: packageName,
          price: amount.toString(),
          quantity: "1"
        }
      ]
    };

    const response = await axios.post(
      `${FAWATERAK_API_URL}/invoiceInitPay`,
      paymentData,
      {
        headers: {
          'Authorization': `Bearer ${FAWATERAK_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const { data } = response.data;

    // Create payment record
    const payment = new Payment({
      userId: user._id,
      invoiceId: data.invoice_id,
      invoiceKey: data.invoice_key,
      amount: amount,
      paymentMethod: paymentMethodId === 2 ? 'Visa-Mastercard' : 
                    paymentMethodId === 3 ? 'Fawry' : 'Meeza',
      points: points,
      paymentData: data.payment_data
    });

    await payment.save();

    // Return appropriate response based on payment method
    if (paymentMethodId === 2) { // Visa/Mastercard
      return res.json({
        success: true,
        redirectUrl: data.payment_data.redirectTo,
        paymentId: payment._id
      });
    } else if (paymentMethodId === 3) { // Fawry
      return res.json({
        success: true,
        fawryCode: data.payment_data.fawryCode,
        expireDate: data.payment_data.expireDate,
        paymentId: payment._id
      });
    } else if (paymentMethodId === 4) { // Meeza
      return res.json({
        success: true,
        meezaReference: data.payment_data.meezaReference,
        paymentId: payment._id
      });
    }

  } catch (error) {
    console.error('Payment initiation error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to initiate payment'
    });
  }
});

// Verify payment status
router.get('/verify/:paymentId', auth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.paymentId);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Verify payment belongs to user
    if (payment.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const response = await axios.get(
      `${FAWATERAK_API_URL}/invoice/${payment.invoiceId}`,
      {
        headers: {
          'Authorization': `Bearer ${FAWATERAK_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const { data } = response.data;

    // Update payment status
    payment.status = data.status === 'paid' ? 'success' : 
                    data.status === 'failed' ? 'failed' : 'pending';
    
    if (payment.status === 'success') {
      // Add points to user
      const user = await User.findById(req.user.id);
      user.points += payment.points;
      await user.save();
    }

    await payment.save();

    res.json({
      success: true,
      status: payment.status,
      points: payment.points
    });

  } catch (error) {
    console.error('Payment verification error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to verify payment'
    });
  }
});

// Webhook handler for payment status updates
router.post('/webhook', async (req, res) => {
  try {
    const { invoice_id, status } = req.body;

    const payment = await Payment.findOne({ invoiceId: invoice_id });
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    payment.status = status === 'paid' ? 'success' : 
                    status === 'failed' ? 'failed' : 'pending';
    
    if (payment.status === 'success') {
      // Add points to user
      const user = await User.findById(payment.userId);
      user.points += payment.points;
      await user.save();
    }

    await payment.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router; 