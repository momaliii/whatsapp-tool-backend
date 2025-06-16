const Subscription = require('../models/Subscription');
const User = require('../models/User');
const Plan = require('../models/Plan');
const { createInvoice } = require('../utils/invoiceGenerator');
const { sendEmail } = require('../utils/emailService');

// Create a new subscription
exports.createSubscription = async (req, res) => {
  try {
    const { userId, planId, billingCycle, paymentMethod } = req.body;

    // Get plan details
    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    // Calculate end date based on billing cycle
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + (billingCycle === 'yearly' ? 12 : 1));

    // Create subscription
    const subscription = new Subscription({
      user: userId,
      plan: planId,
      billingCycle,
      endDate,
      paymentMethod,
      features: plan.features,
      status: 'pending'
    });

    await subscription.save();

    // Create invoice
    const invoice = await createInvoice(subscription, plan);

    // Send confirmation email
    await sendEmail({
      to: req.user.email,
      subject: 'Subscription Created',
      template: 'subscription-created',
      data: {
        planName: plan.name,
        endDate: subscription.endDate,
        invoiceUrl: invoice.url
      }
    });

    res.status(201).json({ subscription, invoice });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user's subscription
exports.getSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ user: req.user._id })
      .populate('plan')
      .populate('user', 'email name');

    if (!subscription) {
      return res.status(404).json({ message: 'No subscription found' });
    }

    res.json(subscription);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update subscription
exports.updateSubscription = async (req, res) => {
  try {
    const { planId, billingCycle, autoRenew } = req.body;
    const subscription = await Subscription.findOne({ user: req.user._id });

    if (!subscription) {
      return res.status(404).json({ message: 'No subscription found' });
    }

    if (planId) {
      const plan = await Plan.findById(planId);
      if (!plan) {
        return res.status(404).json({ message: 'Plan not found' });
      }
      subscription.plan = planId;
      subscription.features = plan.features;
    }

    if (billingCycle) {
      subscription.billingCycle = billingCycle;
    }

    if (typeof autoRenew === 'boolean') {
      subscription.autoRenew = autoRenew;
    }

    await subscription.save();
    res.json(subscription);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cancel subscription
exports.cancelSubscription = async (req, res) => {
  try {
    const { reason } = req.body;
    const subscription = await Subscription.findOne({ user: req.user._id });

    if (!subscription) {
      return res.status(404).json({ message: 'No subscription found' });
    }

    subscription.status = 'cancelled';
    subscription.cancellationReason = reason;
    subscription.autoRenew = false;

    await subscription.save();

    // Send cancellation email
    await sendEmail({
      to: req.user.email,
      subject: 'Subscription Cancelled',
      template: 'subscription-cancelled',
      data: {
        planName: subscription.plan.name,
        endDate: subscription.endDate,
        reason
      }
    });

    res.json({ message: 'Subscription cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get subscription usage
exports.getUsage = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ user: req.user._id });

    if (!subscription) {
      return res.status(404).json({ message: 'No subscription found' });
    }

    // Reset usage if needed
    subscription.resetUsage();

    res.json({
      usage: subscription.usage,
      features: subscription.features,
      status: subscription.status,
      endDate: subscription.endDate
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get billing history
exports.getBillingHistory = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ user: req.user._id });

    if (!subscription) {
      return res.status(404).json({ message: 'No subscription found' });
    }

    res.json(subscription.billingHistory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Process subscription renewal
exports.processRenewal = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ user: req.user._id });

    if (!subscription) {
      return res.status(404).json({ message: 'No subscription found' });
    }

    if (!subscription.autoRenew) {
      return res.status(400).json({ message: 'Auto-renewal is disabled' });
    }

    // Calculate new end date
    const newEndDate = new Date(subscription.endDate);
    newEndDate.setMonth(newEndDate.getMonth() + (subscription.billingCycle === 'yearly' ? 12 : 1));

    // Create new invoice
    const plan = await Plan.findById(subscription.plan);
    const invoice = await createInvoice(subscription, plan);

    // Update subscription
    subscription.endDate = newEndDate;
    subscription.billingHistory.push({
      amount: plan.pricing[subscription.billingCycle],
      currency: 'USD',
      date: new Date(),
      status: 'paid',
      invoiceId: invoice.id
    });

    await subscription.save();

    // Send renewal email
    await sendEmail({
      to: req.user.email,
      subject: 'Subscription Renewed',
      template: 'subscription-renewed',
      data: {
        planName: plan.name,
        newEndDate: subscription.endDate,
        invoiceUrl: invoice.url
      }
    });

    res.json({ message: 'Subscription renewed successfully', invoice });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 