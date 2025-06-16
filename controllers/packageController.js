const PointsPackage = require('../models/PointsPackage');
const PointsPurchase = require('../models/PointsPurchase');
const User = require('../models/User');

// Get all packages
exports.getAllPackages = async (req, res) => {
  try {
    const packages = await PointsPackage.find();
    res.json(packages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single package
exports.getPackage = async (req, res) => {
  try {
    const pkg = await PointsPackage.findById(req.params.id);
    if (!pkg) return res.status(404).json({ message: 'Package not found' });
    res.json(pkg);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new package
exports.createPackage = async (req, res) => {
  try {
    const pkg = new PointsPackage(req.body);
    const newPkg = await pkg.save();
    res.status(201).json(newPkg);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update a package
exports.updatePackage = async (req, res) => {
  try {
    const pkg = await PointsPackage.findById(req.params.id);
    if (!pkg) return res.status(404).json({ message: 'Package not found' });
    Object.assign(pkg, req.body);
    const updatedPkg = await pkg.save();
    res.json(updatedPkg);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a package
exports.deletePackage = async (req, res) => {
  try {
    const pkg = await PointsPackage.findById(req.params.id);
    if (!pkg) return res.status(404).json({ message: 'Package not found' });
    await pkg.deleteOne();
    res.json({ message: 'Package deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Purchase a package
exports.purchasePackage = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { packageId } = req.body;
    const pkg = await PointsPackage.findById(packageId);
    if (!pkg) return res.status(404).json({ message: 'Package not found' });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Add points to user
    user.points = (user.points || 0) + pkg.points;
    await user.save();

    // Record purchase
    const purchase = new PointsPurchase({
      user: user._id,
      package: pkg._id,
      points: pkg.points,
      price: pkg.price,
      currency: pkg.currency,
      status: 'completed'
    });
    await purchase.save();

    res.status(201).json({ message: 'Purchase successful', points: user.points, purchase });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get current user's points and purchase history
exports.getMyPurchases = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const purchases = await PointsPurchase.find({ user: userId }).populate('package').sort({ purchasedAt: -1 });
    res.json({ points: user.points || 0, purchases });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 