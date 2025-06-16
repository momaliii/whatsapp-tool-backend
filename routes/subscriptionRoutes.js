const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { authenticate } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticate);

// Create new subscription
router.post('/', subscriptionController.createSubscription);

// Get current subscription
router.get('/', subscriptionController.getSubscription);

// Update subscription
router.put('/', subscriptionController.updateSubscription);

// Cancel subscription
router.post('/cancel', subscriptionController.cancelSubscription);

// Get subscription usage
router.get('/usage', subscriptionController.getUsage);

// Get billing history
router.get('/billing', subscriptionController.getBillingHistory);

// Process subscription renewal
router.post('/renew', subscriptionController.processRenewal);

module.exports = router; 