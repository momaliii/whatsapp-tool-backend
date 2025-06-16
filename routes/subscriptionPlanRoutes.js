const express = require('express');
const router = express.Router();
const subscriptionPlanController = require('../controllers/subscriptionPlanController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Public routes
router.get('/', subscriptionPlanController.getAllPlans);
router.get('/:id', subscriptionPlanController.getPlan);

// Admin routes
router.post('/', authenticateToken, isAdmin, subscriptionPlanController.createPlan);
router.put('/:id', authenticateToken, isAdmin, subscriptionPlanController.updatePlan);
router.delete('/:id', authenticateToken, isAdmin, subscriptionPlanController.deletePlan);

module.exports = router; 