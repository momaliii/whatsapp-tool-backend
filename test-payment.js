const axios = require('axios');

const API_URL = 'https://whatsapp-tool-backend.onrender.com/api';
const TEST_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODQyYjhjZmVjY2FlM2Q4MzI4NzZjNDciLCJpYXQiOjE3NDkyMDMxNTEsImV4cCI6MTc1MTc5NTE1MX0.wOfv1QVkcNJFEqivqK1Gb_ZnSMaV1e_7r4rvD5mJVIM';

async function testPaymentIntegration() {
  try {
    console.log('Testing Payment Integration...\n');

    // 1. Test getting payment methods
    console.log('1. Testing GET /payment/methods');
    const methodsResponse = await axios.get(`${API_URL}/payment/methods`, {
      headers: {
        Authorization: `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });
    console.log('Available payment methods:', methodsResponse.data);
    console.log('-----------------------------------\n');

    // 2. Test initiating a payment
    console.log('2. Testing POST /payment/initiate');
    const paymentData = {
      paymentMethodId: 2, // Visa/Mastercard
      amount: 100,
      points: 1000,
      packageName: 'Test Package',
    };

    const initiateResponse = await axios.post(
      `${API_URL}/payment/initiate`,
      paymentData,
      {
        headers: {
          Authorization: `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json',
        },
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
            Authorization: `Bearer ${TEST_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      );
      console.log('Payment verification:', verifyResponse.data);
      console.log('-----------------------------------\n');
    }
  } catch (error) {
    console.error(
      'Error testing payment integration:',
      error.response?.data || error.message
    );
  }
}

testPaymentIntegration();
