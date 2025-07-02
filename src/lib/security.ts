
'use client';

import type { Credential } from '@/types';

/**
 * Hashes a string using SHA-1.
 * @param text The string to hash.
 * @returns The SHA-1 hash as a hex string.
 */
async function sha1(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex.toUpperCase();
}

/**
 * Checks if a password has been pwned using the Have I Been Pwned API.
 * This is done securely without sending the full password.
 * @param password The password to check.
 * @returns The number of times the password has been pwned, or 0 if not found.
 */
export async function checkPwnedPassword(password: string): Promise<number> {
  try {
    const hash = await sha1(password);
    const prefix = hash.substring(0, 5);
    const suffix = hash.substring(5);

    // The k-Anonymity model requires that we only send the first 5 chars of the hash
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    if (!response.ok) {
        // HIBP API returns 404 for no matches found for the prefix, which is a success case for us.
        if (response.status === 404) return 0;
        // Other errors indicate a problem with the request or service.
        throw new Error(`HIBP API request failed with status: ${response.status}`);
    }

    const text = await response.text();
    const lines = text.split('\n');
    
    // Now we check the full hash against the list of suffixes returned by the API
    for (const line of lines) {
      const [hashSuffix, count] = line.split(':');
      if (hashSuffix === suffix) {
        return parseInt(count, 10);
      }
    }

    return 0; // Not found in the breach data
  } catch (error) {
    console.error("Error checking pwned password:", error);
    // In case of an error, we'll return 0 to avoid false positives for the user.
    // The error is logged for the developer to investigate.
    return 0;
  }
}

/**
 * Analyzes credentials for security weaknesses.
 * @param credentials The list of credentials to analyze.
 * @returns A full security report.
 */
export async function analyzeCredentials(credentials: Credential[]): Promise<SecurityReport> {
  const pwnedPasswords: CompromisedCredential[] = [];
  const reusedPasswords: ReusedPasswordGroup[] = [];
  const weakPasswords: Credential[] = [];

  const passwordMap: { [password: string]: string[] } = {};

  // Check for pwned and weak passwords, and group them for reuse check
  for (const cred of credentials) {
    // Check for weak passwords (e.g., less than 8 characters)
    if (cred.password.length < 8) {
      weakPasswords.push(cred);
    }

    // Group credentials by password for reuse check
    if (!passwordMap[cred.password]) {
      passwordMap[cred.password] = [];
    }
    passwordMap[cred.password].push(cred.id);
    
    // Check Have I Been Pwned API for breaches
    const pwnedCount = await checkPwnedPassword(cred.password);
    if (pwnedCount > 0) {
      pwnedPasswords.push({ ...cred, pwnedCount });
    }
  }

  // Identify groups of reused passwords
  for (const password in passwordMap) {
    if (passwordMap[password].length > 1) {
      const reusedCreds = credentials.filter(c => passwordMap[password].includes(c.id));
      reusedPasswords.push({
        count: reusedCreds.length,
        credentials: reusedCreds,
      });
    }
  }

  return {
    pwned: pwnedPasswords,
    reused: reusedPasswords,
    weak: weakPasswords,
  };
}


// --- Type Definitions for the Security Report ---

export interface CompromisedCredential extends Credential {
    pwnedCount: number;
}

export interface ReusedPasswordGroup {
    count: number;
    credentials: Credential[];
}

export interface SecurityReport {
    pwned: CompromisedCredential[];
    reused: ReusedPasswordGroup[];
    weak: Credential[];
}
