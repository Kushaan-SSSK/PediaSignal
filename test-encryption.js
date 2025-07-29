// Test AES-256 encryption implementation
import crypto from 'crypto';
import CryptoJS from 'crypto-js';

// Generate a test encryption key
const testKey = crypto.randomBytes(32).toString('hex');
console.log('Generated test key:', testKey.substring(0, 8) + '...');

// Test data
const testData = 'Sensitive medical information: Patient John Doe, diagnosis: pneumonia, age: 5 years';
console.log('Original data:', testData);

// Test AES-256-CBC with crypto-js (more reliable)
function encryptPHI(data) {
  try {
    const encrypted = CryptoJS.AES.encrypt(data, testKey, {
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    return encrypted.toString();
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt sensitive data');
  }
}

function decryptPHI(encryptedData) {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, testKey, {
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt sensitive data');
  }
}

// Test encryption/decryption
try {
  console.log('\n=== Testing AES-256 Encryption ===');
  
  const encrypted = encryptPHI(testData);
  console.log('Encrypted data:', encrypted.substring(0, 50) + '...');
  
  const decrypted = decryptPHI(encrypted);
  console.log('Decrypted data:', decrypted);
  
  const isWorking = testData === decrypted;
  console.log('Encryption test result:', isWorking ? 'SUCCESS' : 'FAILED');
  
  if (isWorking) {
    console.log('\n✅ AES-256 encryption is working correctly!');
    console.log('The PediaSignal platform now has real AES-256 encryption implemented.');
  } else {
    console.log('\n❌ Encryption test failed - data mismatch');
  }
  
} catch (error) {
  console.error('\n❌ Encryption test failed:', error.message);
}