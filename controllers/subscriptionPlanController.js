const SubscriptionPlan = require('../models/SubscriptionPlan');

// Get all subscription plans
exports.getAllPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find({ isActive: true });
    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single subscription plan
exports.getPlan = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ message: 'Subscription plan not found' });
    }
    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new subscription plan
exports.createPlan = async (req, res) => {
  try {
    const plan = new SubscriptionPlan(req.body);
    const newPlan = await plan.save();
    res.status(201).json(newPlan);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update a subscription plan
exports.updatePlan = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ message: 'Subscription plan not found' });
    }

    Object.assign(plan, req.body);
    const updatedPlan = await plan.save();
    res.json(updatedPlan);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a subscription plan (soft delete)
exports.deletePlan = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ message: 'Subscription plan not found' });
    }

    plan.isActive = false;
    await plan.save();
    res.json({ message: 'Subscription plan deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 