
import CryptoJS from 'crypto-js';

/**
 * Encrypts a string using AES with the provided key.
 * @param data The string to encrypt.
 * @param key The secret key for encryption.
 * @returns The encrypted string (ciphertext).
 */
export function encryptData(data: string, key: string): string {
  if (!data) return '';
  return CryptoJS.AES.encrypt(data, key).toString();
}

/**
 * Decrypts a string using AES with the provided key.
 * @param ciphertext The encrypted string to decrypt.
 * @param key The secret key for decryption.
 * @returns The original decrypted string, or the ciphertext if decryption fails.
 */
export function decryptData(ciphertext: string, key: string): string {
  if (!ciphertext) return '';
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, key);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    // If originalText is empty, decryption likely failed. Return the raw data.
    // This also handles cases where data was not encrypted before this feature.
    if (originalText) {
        return originalText;
    }
    return ciphertext;
  } catch (error) {
    console.error('Decryption failed, returning raw data:', error);
    return ciphertext;
  }
}

/**
 * Hashes a string using SHA-256.
 * @param text The string to hash.
 * @returns The SHA-256 hash as a hex string.
 */
export function sha256(text: string): string {
  return CryptoJS.SHA256(text).toString(CryptoJS.enc.Hex);
}
