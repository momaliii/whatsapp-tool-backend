const User = require('../models/User');
const Notification = require('../models/Notification');

const notificationService = {
  // Create a notification
  async createNotification(userId, type, title, message) {
    try {
      const notification = new Notification({
        userId,
        type,
        title,
        message
      });
      await notification.save();
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  },

  // Check and create trial expiration notifications
  async checkTrialExpiration() {
    try {
      const now = new Date();
      const threeDaysFromNow = new Date(now);
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

      // Find users whose trial expires in the next 3 days
      const expiringTrials = await User.find({
        'subscription.plan': 'trial',
        'subscription.trialEndsAt': {
          $gte: now,
          $lte: threeDaysFromNow
        }
      });

      for (const user of expiringTrials) {
        const daysRemaining = Math.ceil((user.subscription.trialEndsAt - now) / (1000 * 60 * 60 * 24));
        
        // Check if notification already exists for this user
        const existingNotification = await Notification.findOne({
          userId: user._id,
          type: 'trial_expiring',
          createdAt: { $gte: new Date(now - 24 * 60 * 60 * 1000) } // Within last 24 hours
        });

        if (!existingNotification) {
          await this.createNotification(
            user._id,
            'trial_expiring',
            'Trial Period Ending Soon',
            `Your trial period will end in ${daysRemaining} days. Upgrade now to continue enjoying premium features!`
          );
        }
      }

      // Find users whose trial has just ended
      const endedTrials = await User.find({
        'subscription.plan': 'trial',
        'subscription.trialEndsAt': { $lt: now }
      });

      for (const user of endedTrials) {
        // Check if notification already exists for this user
        const existingNotification = await Notification.findOne({
          userId: user._id,
          type: 'trial_ended',
          createdAt: { $gte: new Date(now - 24 * 60 * 60 * 1000) } // Within last 24 hours
        });

        if (!existingNotification) {
          await this.createNotification(
            user._id,
            'trial_ended',
            'Trial Period Ended',
            'Your trial period has ended. Upgrade now to continue using premium features!'
          );
          
          // Update user's plan to free
          user.subscription.plan = 'free';
          await user.save();
        }
      }
    } catch (error) {
      console.error('Error checking trial expiration:', error);
      throw error;
    }
  }
};

module.exports = notificationService; 