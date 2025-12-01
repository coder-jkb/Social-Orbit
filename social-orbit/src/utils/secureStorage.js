/**
 * SECURE STORAGE UTILITY
 * Uses Web Crypto API for client-side encryption
 * 
 * Security Features:
 * - AES-256-GCM encryption
 * - PBKDF2 key derivation from passphrase
 * - Random salt and IV for each encryption
 * - No plaintext sensitive data in localStorage
 */

const DB_NAME = 'SocialOrbitVault';
const DB_VERSION = 1;
const STORE_NAME = 'encrypted_data';
const SALT_KEY = 'socialOrbit_salt'; // Only stores random salt (not sensitive)

// ============ INDEXEDDB HELPERS ============

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };
  });
}

async function dbGet(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(key);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result?.value);
  });
}

async function dbSet(key, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put({ key, value });
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

async function dbDelete(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(key);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

async function dbClear() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.clear();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// ============ CRYPTO HELPERS ============

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function generateSalt() {
  return crypto.getRandomValues(new Uint8Array(32));
}

async function deriveKey(passphrase, salt) {
  const encoder = new TextEncoder();
  const passphraseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000, // High iterations for security
      hash: 'SHA-256'
    },
    passphraseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encrypt(data, key) {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(JSON.stringify(data))
  );
  
  // Combine IV + encrypted data for storage
  return {
    iv: arrayBufferToBase64(iv),
    data: arrayBufferToBase64(encrypted)
  };
}

async function decrypt(encryptedObj, key) {
  const decoder = new TextDecoder();
  const iv = base64ToArrayBuffer(encryptedObj.iv);
  const data = base64ToArrayBuffer(encryptedObj.data);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(iv) },
    key,
    data
  );
  
  return JSON.parse(decoder.decode(decrypted));
}

// ============ SECURE STORAGE CLASS ============

class SecureStorage {
  constructor() {
    this.derivedKey = null;
    this.isUnlocked = false;
    this.memoryCache = {}; // In-memory cache for decrypted data
    this.apiKeyMemory = null; // API key stored ONLY in memory (never persisted)
  }

  // Get or create salt for key derivation
  async getSalt() {
    let saltBase64 = localStorage.getItem(SALT_KEY);
    if (!saltBase64) {
      const salt = await generateSalt();
      saltBase64 = arrayBufferToBase64(salt);
      localStorage.setItem(SALT_KEY, saltBase64);
    }
    return new Uint8Array(base64ToArrayBuffer(saltBase64));
  }

  // Check if vault exists (has been set up)
  async vaultExists() {
    const testData = await dbGet('_vault_check');
    return !!testData;
  }

  // Initialize vault with passphrase (first time setup)
  async initializeVault(passphrase) {
    if (passphrase.length < 4) {
      throw new Error('Passphrase must be at least 4 characters');
    }
    
    const salt = await this.getSalt();
    this.derivedKey = await deriveKey(passphrase, salt);
    this.isUnlocked = true;
    
    // Store a verification token to check passphrase correctness later
    const verificationData = await encrypt({ verified: true, timestamp: Date.now() }, this.derivedKey);
    await dbSet('_vault_check', verificationData);
    
    return true;
  }

  // Unlock existing vault
  async unlock(passphrase) {
    const salt = await this.getSalt();
    this.derivedKey = await deriveKey(passphrase, salt);
    
    // Verify passphrase by trying to decrypt verification token
    try {
      const verificationData = await dbGet('_vault_check');
      if (!verificationData) {
        throw new Error('Vault not initialized');
      }
      await decrypt(verificationData, this.derivedKey);
      this.isUnlocked = true;
      this.memoryCache = {}; // Clear cache on new unlock
      return true;
    } catch (e) {
      this.derivedKey = null;
      this.isUnlocked = false;
      throw new Error('Incorrect passphrase');
    }
  }

  // Lock the vault
  lock() {
    this.derivedKey = null;
    this.isUnlocked = false;
    this.memoryCache = {};
    this.apiKeyMemory = null;
  }

  // Store encrypted data
  async setItem(key, value) {
    if (!this.isUnlocked) throw new Error('Vault is locked');
    
    const encrypted = await encrypt(value, this.derivedKey);
    await dbSet(key, encrypted);
    this.memoryCache[key] = value; // Update cache
  }

  // Retrieve and decrypt data
  async getItem(key) {
    if (!this.isUnlocked) throw new Error('Vault is locked');
    
    // Check cache first
    if (this.memoryCache[key] !== undefined) {
      return this.memoryCache[key];
    }
    
    const encrypted = await dbGet(key);
    if (!encrypted) return null;
    
    try {
      const decrypted = await decrypt(encrypted, this.derivedKey);
      this.memoryCache[key] = decrypted; // Cache for performance
      return decrypted;
    } catch (e) {
      console.error('Decryption failed for key:', key);
      return null;
    }
  }

  // Remove item
  async removeItem(key) {
    if (!this.isUnlocked) throw new Error('Vault is locked');
    await dbDelete(key);
    delete this.memoryCache[key];
  }

  // API Key handling - MEMORY ONLY (never persisted)
  setApiKey(key) {
    this.apiKeyMemory = key;
  }

  getApiKey() {
    return this.apiKeyMemory;
  }

  clearApiKey() {
    this.apiKeyMemory = null;
  }

  // Change passphrase (requires current passphrase)
  async changePassphrase(currentPassphrase, newPassphrase) {
    // Verify current passphrase
    const salt = await this.getSalt();
    const oldKey = await deriveKey(currentPassphrase, salt);
    
    try {
      const verificationData = await dbGet('_vault_check');
      await decrypt(verificationData, oldKey);
    } catch (e) {
      throw new Error('Current passphrase is incorrect');
    }
    
    if (newPassphrase.length < 4) {
      throw new Error('New passphrase must be at least 4 characters');
    }
    
    // Get all stored keys and re-encrypt with new passphrase
    const db = await openDB();
    const allKeys = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAllKeys();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
    
    // Decrypt all data with old key
    const decryptedData = {};
    for (const key of allKeys) {
      if (key === '_vault_check') continue;
      const encrypted = await dbGet(key);
      if (encrypted) {
        try {
          decryptedData[key] = await decrypt(encrypted, oldKey);
        } catch (e) {
          console.warn('Could not decrypt key:', key);
        }
      }
    }
    
    // Generate new salt and key
    const newSalt = await generateSalt();
    localStorage.setItem(SALT_KEY, arrayBufferToBase64(newSalt));
    this.derivedKey = await deriveKey(newPassphrase, newSalt);
    
    // Re-encrypt all data with new key
    const newVerification = await encrypt({ verified: true, timestamp: Date.now() }, this.derivedKey);
    await dbSet('_vault_check', newVerification);
    
    for (const [key, value] of Object.entries(decryptedData)) {
      const encrypted = await encrypt(value, this.derivedKey);
      await dbSet(key, encrypted);
    }
    
    this.memoryCache = decryptedData;
    return true;
  }

  // Destroy vault completely
  async destroyVault() {
    await dbClear();
    localStorage.removeItem(SALT_KEY);
    this.lock();
  }

  // Export all data (decrypted) for backup
  async exportData() {
    if (!this.isUnlocked) throw new Error('Vault is locked');
    
    const db = await openDB();
    const allKeys = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAllKeys();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
    
    const exported = {};
    for (const key of allKeys) {
      if (key === '_vault_check') continue;
      exported[key] = await this.getItem(key);
    }
    
    return exported;
  }

  // Import data
  async importData(data) {
    if (!this.isUnlocked) throw new Error('Vault is locked');
    
    for (const [key, value] of Object.entries(data)) {
      await this.setItem(key, value);
    }
  }
}

// Singleton instance
const secureStorage = new SecureStorage();

// Migration helper - import from old localStorage
export async function migrateFromLocalStorage() {
  const keysToMigrate = [
    { old: 'socialOrbit_friends', new: 'friends' },
    { old: 'socialOrbit_persona', new: 'persona' },
    { old: 'socialOrbit_formData', new: 'formData' },
    { old: 'socialOrbit_mockMode', new: 'mockMode' },
  ];
  
  const migrated = {};
  
  for (const { old, new: newKey } of keysToMigrate) {
    const data = localStorage.getItem(old);
    if (data) {
      try {
        migrated[newKey] = JSON.parse(data);
      } catch (e) {
        migrated[newKey] = data;
      }
    }
  }
  
  // Handle API key separately - just return it, don't persist
  const apiKey = localStorage.getItem('socialOrbit_apiKey');
  
  return { data: migrated, apiKey };
}

// Clear old localStorage after successful migration
export function clearOldLocalStorage() {
  const keysToRemove = [
    'socialOrbit_friends',
    'socialOrbit_persona', 
    'socialOrbit_formData',
    'socialOrbit_mockMode',
    'socialOrbit_apiKey' // IMPORTANT: Remove plaintext API key!
  ];
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
}

export default secureStorage;

