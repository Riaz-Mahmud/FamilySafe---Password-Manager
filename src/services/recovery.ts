
'use server';
/**
 * @fileOverview A service to handle secure account recovery.
 *
 * - recoverAccount - A function that validates a secret key and sends a password reset email.
 * - AccountRecoveryInput - The input type for the recoverAccount function.
 * - AccountRecoveryOutput - The return type for the recoverAccount function.
 */

import { z } from 'zod';
import sgMail from '@sendgrid/mail';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { sha256 } from '@/lib/crypto';

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

  try {
    // 1. Get user by email using Firebase Admin SDK
    const userRecord = await adminAuth.getUserByEmail(email);
    const userId = userRecord.uid;

    // 2. Get user document from Firestore to retrieve the stored key hash
    const userDocRef = adminDb.doc(`users/${userId}`);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      // This case should be rare if a user exists in Auth but not Firestore
      return { success: false, message: 'User data not found.' };
    }

    const storedHash = userDoc.data()?.recoveryKeyHash;
    if (!storedHash) {
      return { success: false, message: 'No recovery key has been set up for this account.' };
    }

    // 3. Hash the provided secret key and compare with the stored hash
    const providedKeyHash = sha256(secretKey);

    if (providedKeyHash !== storedHash) {
      return { success: false, message: 'The provided secret key is incorrect.' };
    }

    // 4. If hashes match, generate a password reset link
    const resetLink = await adminAuth.generatePasswordResetLink(email);

    // 5. Send the email using SendGrid
    const sendGridApiKey = process.env.SENDGRID_API_KEY;
    const sendGridFromEmail = process.env.SENDGRID_FROM_EMAIL;

    if (!sendGridApiKey || !sendGridFromEmail) {
      console.error('SendGrid environment variables not set.');
      return { success: false, message: 'Email service is not configured on the server.' };
    }

    sgMail.setApiKey(sendGridApiKey);
    const msg = {
      to: email,
      from: sendGridFromEmail,
      subject: 'Your FamilySafe Account Recovery Link',
      text: `Hello,\n\nYou have requested to recover your FamilySafe account. Please use the following link to reset your password:\n\n${resetLink}\n\nIf you did not request this, you can safely ignore this email.\n\nThe FamilySafe Team`,
      trackingSettings: {
        clickTracking: {
          enable: false,
        },
      },
    };

    await sgMail.send(msg);

    return { success: true, message: 'Recovery email sent successfully.' };

  } catch (error: any) {
    // Check for "user-not-found" error from Firebase Admin.
    // We log the actual error on the server but don't reveal it to the client.
    if (error.code === 'auth/user-not-found') {
      return { success: false, message: 'No user found with this email address.' };
    }
    console.error('Error during account recovery:', error);
    return { success: false, message: 'An unexpected error occurred during account recovery.' };
  }
}
