const axios = require('axios');

const API_URL = 'https://whatsapp-tool-backend.onrender.com/api';

async function testAuth() {
  try {
    console.log('Testing Authentication...\n');

    // 1. Create a test user
    console.log('1. Creating test user');
    const signupData = {
      email: 'test@example.com',
      password: 'test123',
      name: 'Test User'
    };

    const signupResponse = await axios.post(`${API_URL}/auth/signup`, signupData);
    console.log('User created:', signupResponse.data);
    const token = signupResponse.data.token;
    console.log('Token:', token);
    console.log('-----------------------------------\n');

    // 2. Test login
    console.log('2. Testing login');
    const loginData = {
      email: 'test@example.com',
      password: 'test123'
    };

    const loginResponse = await axios.post(`${API_URL}/auth/login`, loginData);
    console.log('Login successful:', loginResponse.data);
    console.log('-----------------------------------\n');

    // 3. Test getting current user
    console.log('3. Testing get current user');
    const meResponse = await axios.get(`${API_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('Current user:', meResponse.data);
    console.log('-----------------------------------\n');

    return token;
  } catch (error) {
    console.error('Error testing auth:', error.response?.data || error.message);
    return null;
  }
}

// Run the tests
testAuth().then(token => {
  if (token) {
    console.log('Auth test successful! Token:', token);
    console.log('You can use this token for testing the payment integration.');
  } else {
    console.log('Auth test failed!');
  }
}); 