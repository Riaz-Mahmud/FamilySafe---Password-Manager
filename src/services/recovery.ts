'use server';
/**
 * @fileOverview A service to handle secure account recovery.
 *
 * - recoverAccount - A function that validates a secret key and sends a password reset email.
 * - AccountRecoveryInput - The input type for the recoverAccount function.
 * - AccountRecoveryOutput - The return type for the recoverAccount function.
 */

import { z } from 'zod';
import { adminAuth, adminDb, isFirebaseAdminInitialized } from '@/lib/firebase-admin';
import { sha256 } from '@/lib/crypto';
import { sendEmail } from '@/services/email';

const AccountRecoveryInputSchema = z.object({
  email: z.string().email().describe('The email address for the account to recover.'),
  secretKey: z.string().min(1).describe('The secret recovery key from the user\'s recovery kit.'),
});
export type AccountRecoveryInput = z.infer<typeof AccountRecoveryInputSchema>;

const AccountRecoveryOutputSchema = z.object({
  success: z.boolean().describe('Whether the recovery process was successfully initiated.'),
  message: z.string().describe('A message indicating the result.'),
});
export type AccountRecoveryOutput = z.infer<typeof AccountRecoveryOutputSchema>;

export async function recoverAccount(input: AccountRecoveryInput): Promise<AccountRecoveryOutput> {
  const { email, secretKey } = input;
  
  if (!isFirebaseAdminInitialized) {
    const message = 'Security Check Failed: The Firebase Admin credentials for validating your secret key are not configured on the server. Please add `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY` to your .env file to enable this feature. See README.md for instructions.';
    console.error(`[Recovery] Failure for ${email}: ${message}`);
    return { success: false, message };
  }

  if (!adminAuth || !adminDb) {
    const message = 'A server error occurred: Firebase Admin components failed to load even though initialization was reported as successful.';
    console.error(`[Recovery] Failure for ${email}: ${message}`);
    return { success: false, message };
  }

  console.log(`[Recovery] Starting recovery process for: ${email}`);
  
  try {
    // 1. Get user by email using Firebase Admin SDK
    console.log(`[Recovery] Fetching user record for: ${email}`);
    const userRecord = await adminAuth.getUserByEmail(email);
    const userId = userRecord.uid;
    console.log(`[Recovery] Found user ID: ${userId}`);

    // 2. Get user document from Firestore to retrieve the stored key hash
    console.log(`[Recovery] Fetching Firestore document for user: ${userId}`);
    const userDocRef = adminDb.doc(`users/${userId}`);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists || !userDoc.data()?.recoveryKeyHash) {
      const reason = !userDoc.exists ? "User document does not exist" : "No recoveryKeyHash found";
      console.error(`[Recovery] Failure for ${email}: ${reason}.`);
      return { success: false, message: 'The email or secret key is incorrect. No recovery key has been set up for this account.' };
    }

    const storedHash = userDoc.data()?.recoveryKeyHash;
    console.log(`[Recovery] Found stored key hash for user: ${userId}`);

    // 3. Hash the provided secret key and compare with the stored hash
    const providedKeyHash = sha256(secretKey);

    if (providedKeyHash !== storedHash) {
      console.warn(`[Recovery] Failure for ${email}: Provided key hash does not match stored hash.`);
      return { success: false, message: 'The email or secret key is incorrect. Please try again.' };
    }

    // 4. If hashes match, generate a password reset link
    console.log(`[Recovery] Key validation successful for ${email}. Generating password reset link...`);
    const resetLink = await adminAuth.generatePasswordResetLink(email);

    // 5. Send the email using the centralized email service
    console.log(`[Recovery] Sending recovery email to ${email}...`);
    const emailResult = await sendEmail({
      to: email,
      subject: 'Your FamilySafe Account Recovery Link',
      body: `Hello,\n\nYou have requested to recover your FamilySafe account. Please use the following link to reset your password:\n\n${resetLink}\n\nIf you did not request this, you can safely ignore this email.\n\nThe FamilySafe Team`,
    });
    
    if (emailResult.success) {
      console.log(`[Recovery] Email sent successfully to ${email}.`);
    } else {
      console.error(`[Recovery] Failed to send email to ${email}: ${emailResult.message}`);
    }

    // Return the email service result directly. This will be 'success: true' if the email was sent,
    // or 'success: false' with a specific error if it failed (e.g. bad SendGrid key).
    return emailResult;

  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      console.warn(`[Recovery] Failure: No user found with email: ${email}`);
      return { success: false, message: 'The email or secret key is incorrect. Please try again.' };
    }

    console.error(`[Recovery] An unexpected error occurred for ${email}:`, error);
    return { success: false, message: 'An unexpected error occurred during account recovery.' };
  }
}
