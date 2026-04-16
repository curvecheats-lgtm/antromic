// Setup script to create test account and key
// Run this with: node setup-test.js

const API_URL = 'https://curve-api.umiwinsupport.workers.dev';

async function setup() {
  try {
    const response = await fetch(`${API_URL}/api/setup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        setupKey: 'curve-setup-2025'
      }),
    });

    const data = await response.json();
    console.log('Setup Response:', data);
    
    if (data.success) {
      console.log('\n✅ Test account created successfully!');
      console.log('\n📋 Test Credentials:');
      console.log(`   Username: ${data.testCredentials.username}`);
      console.log(`   Password: ${data.testCredentials.password}`);
      console.log(`   Key:      ${data.testCredentials.key}`);
    } else {
      console.log('\n❌ Setup failed:', data.error);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

setup();
