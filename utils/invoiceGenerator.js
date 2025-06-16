const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const createInvoice = async (subscription, plan) => {
  const invoiceId = uuidv4();
  const invoiceDate = new Date();
  const dueDate = new Date(invoiceDate);
  dueDate.setDate(dueDate.getDate() + 30); // 30 days payment term

  // Create PDF document
  const doc = new PDFDocument();
  const invoicePath = path.join(__dirname, '../public/invoices', `${invoiceId}.pdf`);
  
  // Ensure directory exists
  const dir = path.dirname(invoicePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Create write stream
  const stream = fs.createWriteStream(invoicePath);
  doc.pipe(stream);

  // Add content to PDF
  doc.fontSize(25).text('INVOICE', { align: 'center' });
  doc.moveDown();
  
  // Invoice details
  doc.fontSize(12);
  doc.text(`Invoice Number: ${invoiceId}`);
  doc.text(`Date: ${invoiceDate.toLocaleDateString()}`);
  doc.text(`Due Date: ${dueDate.toLocaleDateString()}`);
  doc.moveDown();

  // Company details
  doc.text('Company Name: Your Company');
  doc.text('Address: Your Company Address');
  doc.text('Email: billing@yourcompany.com');
  doc.moveDown();

  // Customer details
  doc.text(`Customer: ${subscription.user.name}`);
  doc.text(`Email: ${subscription.user.email}`);
  doc.moveDown();

  // Subscription details
  doc.text(`Plan: ${plan.name}`);
  doc.text(`Billing Cycle: ${subscription.billingCycle}`);
  doc.text(`Amount: $${plan.pricing[subscription.billingCycle]}`);
  doc.moveDown();

  // Payment instructions
  doc.text('Payment Instructions:');
  doc.text('Please make payment within 30 days.');
  doc.text('Bank: Your Bank');
  doc.text('Account: Your Account Number');
  doc.moveDown();

  // Terms and conditions
  doc.text('Terms and Conditions:');
  doc.text('1. Payment is due within 30 days');
  doc.text('2. All prices are in USD');
  doc.text('3. No refunds for partial months');

  // Finalize PDF
  doc.end();

  return {
    id: invoiceId,
    url: `/invoices/${invoiceId}.pdf`,
    date: invoiceDate,
    dueDate: dueDate,
    amount: plan.pricing[subscription.billingCycle],
    currency: 'USD'
  };
};

module.exports = {
  createInvoice
}; 