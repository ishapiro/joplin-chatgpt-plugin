// Test setup for ChatGPT Toolkit Plugin
require('dotenv').config({ path: '.env.local' });

// Global test setup
beforeAll(() => {
  console.log('Setting up ChatGPT Toolkit Plugin tests...');
});

afterAll(() => {
  console.log('Cleaning up ChatGPT Toolkit Plugin tests...');
});
