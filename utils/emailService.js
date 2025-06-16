const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');

// Create reusable transporter with SSL
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    // Do not fail on invalid certs
    rejectUnauthorized: false,
    minVersion: 'TLSv1.2'
  },
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 10000, // 10 seconds
  socketTimeout: 10000, // 10 seconds
  debug: true // Enable debug output
});

// Verify connection configuration
transporter.verify(function(error, success) {
  if (error) {
    console.error('SMTP Connection Error:', error);
  } else {
    console.log('SMTP Server is ready to take our messages');
  }
});

// Load email templates
const loadTemplate = (templateName) => {
  const templatePath = path.join(__dirname, '../templates/emails', `${templateName}.hbs`);
  const template = fs.readFileSync(templatePath, 'utf-8');
  return handlebars.compile(template);
};

// Send email
const sendEmail = async ({ to, subject, template, data }) => {
  try {
    // Load and compile template
    const compiledTemplate = loadTemplate(template);
    const html = compiledTemplate(data);

    // Send email
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html
    });

    console.log('Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

// Email templates
const templates = {
  'subscription-created': {
    subject: 'Welcome to Your New Subscription!',
    template: 'subscription-created'
  },
  'subscription-cancelled': {
    subject: 'Subscription Cancellation Confirmation',
    template: 'subscription-cancelled'
  },
  'subscription-renewed': {
    subject: 'Subscription Renewal Confirmation',
    template: 'subscription-renewed'
  },
  'payment-failed': {
    subject: 'Payment Failed - Action Required',
    template: 'payment-failed'
  },
  'subscription-expiring': {
    subject: 'Your Subscription is Expiring Soon',
    template: 'subscription-expiring'
  }
};

// Send specific email types
const sendSubscriptionCreated = async (user, subscription) => {
  return sendEmail({
    to: user.email,
    subject: templates['subscription-created'].subject,
    template: templates['subscription-created'].template,
    data: {
      name: user.name,
      planName: subscription.plan.name,
      endDate: subscription.endDate
    }
  });
};

const sendSubscriptionCancelled = async (user, subscription) => {
  return sendEmail({
    to: user.email,
    subject: templates['subscription-cancelled'].subject,
    template: templates['subscription-cancelled'].template,
    data: {
      name: user.name,
      planName: subscription.plan.name,
      endDate: subscription.endDate,
      reason: subscription.cancellationReason
    }
  });
};

const sendSubscriptionRenewed = async (user, subscription) => {
  return sendEmail({
    to: user.email,
    subject: templates['subscription-renewed'].subject,
    template: templates['subscription-renewed'].template,
    data: {
      name: user.name,
      planName: subscription.plan.name,
      newEndDate: subscription.endDate
    }
  });
};

const sendPaymentFailed = async (user, subscription) => {
  return sendEmail({
    to: user.email,
    subject: templates['payment-failed'].subject,
    template: templates['payment-failed'].template,
    data: {
      name: user.name,
      planName: subscription.plan.name,
      retryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
    }
  });
};

const sendSubscriptionExpiring = async (user, subscription) => {
  return sendEmail({
    to: user.email,
    subject: templates['subscription-expiring'].subject,
    template: templates['subscription-expiring'].template,
    data: {
      name: user.name,
      planName: subscription.plan.name,
      daysRemaining: Math.ceil((subscription.endDate - new Date()) / (1000 * 60 * 60 * 24))
    }
  });
};

module.exports = {
  sendEmail,
  sendSubscriptionCreated,
  sendSubscriptionCancelled,
  sendSubscriptionRenewed,
  sendPaymentFailed,
  sendSubscriptionExpiring
}; 