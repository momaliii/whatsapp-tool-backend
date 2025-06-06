<<<<<<< HEAD
const axios = require('axios');

const API_URL = 'https://whatsapp-tool-backend.onrender.com/api';
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2YzM5YzM5YzM5YzM5YzM5YzM5YzM5YyIsImlzQWRtaW4iOmZhbHNlLCJpYXQiOjE3NDI5MjQwMDAsImV4cCI6MTc0MzAxMDQwMH0.1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

async function testPaymentIntegration() {
  try {
    console.log('Testing Payment Integration...\n');

    // 1. Test getting payment methods
    console.log('1. Testing GET /payment/methods');
    const methodsResponse = await axios.get(`${API_URL}/payment/methods`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('Available payment methods:', methodsResponse.data);
    console.log('-----------------------------------\n');

    // 2. Test initiating a payment
    console.log('2. Testing POST /payment/initiate');
    const paymentData = {
      paymentMethodId: 2, // Visa/Mastercard
      amount: 100,
      points: 1000,
      packageName: 'Test Package'
    };

    const initiateResponse = await axios.post(
      `${API_URL}/payment/initiate`,
      paymentData,
      {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('Payment initiated:', initiateResponse.data);
    console.log('-----------------------------------\n');

    // 3. Test verifying payment status
    if (initiateResponse.data.paymentId) {
      console.log('3. Testing GET /payment/verify/:paymentId');
      const verifyResponse = await axios.get(
        `${API_URL}/payment/verify/${initiateResponse.data.paymentId}`,
        {
          headers: {
            'Authorization': `Bearer ${TEST_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('Payment verification:', verifyResponse.data);
      console.log('-----------------------------------\n');
    }

  } catch (error) {
    console.error('Error testing payment integration:', error.response?.data || error.message);
  }
}

// Run the tests
=======
const axios = require('axios');

const API_URL = 'https://whatsapp-tool-backend.onrender.com/api';
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2YzM5YzM5YzM5YzM5YzM5YzM5YzM5YyIsImlzQWRtaW4iOmZhbHNlLCJpYXQiOjE3NDI5MjQwMDAsImV4cCI6MTc0MzAxMDQwMH0.1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

async function testPaymentIntegration() {
  try {
    console.log('Testing Payment Integration...\n');

    // 1. Test getting payment methods
    console.log('1. Testing GET /payment/methods');
    const methodsResponse = await axios.get(`${API_URL}/payment/methods`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('Available payment methods:', methodsResponse.data);
    console.log('-----------------------------------\n');

    // 2. Test initiating a payment
    console.log('2. Testing POST /payment/initiate');
    const paymentData = {
      paymentMethodId: 2, // Visa/Mastercard
      amount: 100,
      points: 1000,
      packageName: 'Test Package'
    };

    const initiateResponse = await axios.post(
      `${API_URL}/payment/initiate`,
      paymentData,
      {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('Payment initiated:', initiateResponse.data);
    console.log('-----------------------------------\n');

    // 3. Test verifying payment status
    if (initiateResponse.data.paymentId) {
      console.log('3. Testing GET /payment/verify/:paymentId');
      const verifyResponse = await axios.get(
        `${API_URL}/payment/verify/${initiateResponse.data.paymentId}`,
        {
          headers: {
            'Authorization': `Bearer ${TEST_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('Payment verification:', verifyResponse.data);
      console.log('-----------------------------------\n');
    }

  } catch (error) {
    console.error('Error testing payment integration:', error.response?.data || error.message);
  }
}

// Run the tests
>>>>>>> c748219ba1adc3796d601867ddd17133d2a092e1
testPaymentIntegration(); 