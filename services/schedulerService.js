const notificationService = require('./notificationService');

class SchedulerService {
  constructor() {
    this.checkInterval = null;
  }

  start() {
    // Check for trial expiration every hour
    this.checkInterval = setInterval(async () => {
      try {
        await notificationService.checkTrialExpiration();
      } catch (error) {
        console.error('Error in trial expiration check:', error);
      }
    }, 60 * 60 * 1000); // Run every hour

    // Run initial check
    notificationService.checkTrialExpiration().catch(error => {
      console.error('Error in initial trial expiration check:', error);
    });
  }

  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

module.exports = new SchedulerService(); 