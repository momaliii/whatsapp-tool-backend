const express = require('express');
const router = express.Router();
const packageController = require('../controllers/packageController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Public
router.get('/', packageController.getAllPackages);
router.get('/:id', packageController.getPackage);

// Admin
router.post('/', authenticateToken, isAdmin, packageController.createPackage);
router.put('/:id', authenticateToken, isAdmin, packageController.updatePackage);
router.delete('/:id', authenticateToken, isAdmin, packageController.deletePackage);

// Authenticated users
router.post('/purchase', authenticateToken, packageController.purchasePackage);
router.get('/my-purchases', authenticateToken, packageController.getMyPurchases);

module.exports = router; 