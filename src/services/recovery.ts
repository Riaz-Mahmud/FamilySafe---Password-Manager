
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
import { adminAuth, adminDb, isFirebaseAdminInitialized } from '@/lib/firebase-admin';
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
  
  const sendGridApiKey = process.env.SENDGRID_API_KEY;
  const sendGridFromEmail = process.env.SENDGRID_FROM_EMAIL;
  
  // Check if all necessary services are configured before proceeding
  if (!isFirebaseAdminInitialized || !adminAuth || !adminDb || !sendGridApiKey || !sendGridFromEmail) {
    const message = 'The account recovery feature is not fully configured on the server. Please contact support.';
    console.error(message, {
        firebaseAdmin: isFirebaseAdminInitialized,
        sendGrid: !!sendGridApiKey && !!sendGridFromEmail,
    });
    return { success: false, message };
  }

  try {
    // 1. Get user by email using Firebase Admin SDK
    const userRecord = await adminAuth.getUserByEmail(email);
    const userId = userRecord.uid;

    // 2. Get user document from Firestore to retrieve the stored key hash
    const userDocRef = adminDb.doc(`users/${userId}`);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
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
    // Check for SendGrid-specific error structure first, as it has a `response` property
    if (error.response) {
      const sendGridErrorBody = error.response.body;
      console.error('SendGrid Error during account recovery:', JSON.stringify(sendGridErrorBody, null, 2));
      if (sendGridErrorBody?.errors?.length > 0) {
        const firstError = sendGridErrorBody.errors[0];
        if (firstError.message.includes('authorization')) {
           return { 
              success: false, 
              message: 'SendGrid Authorization Failed: Please check if your SENDGRID_API_KEY is correct and has the required permissions.' 
           };
        }
        if (firstError.message.includes('does not match a verified Sender Identity')) {
           return { 
              success: false, 
              message: 'SendGrid Sender Error: The "from" email address has not been verified in your SendGrid account. Please complete sender verification.'
           };
        }
        return {
           success: false,
           message: `SendGrid Error: ${firstError.message}`
        };
      }
      return {
          success: false,
          message: 'An unexpected error occurred while sending the email. Please check the server logs for more details.'
      };
    }
    
    // Fallback to Firebase/generic error handling
    if (error.code === 'auth/user-not-found') {
      return { success: false, message: 'No user found with this email address.' };
    }

    console.error('Error during account recovery:', error);
    return { success: false, message: 'An unexpected error occurred during account recovery.' };
  }
}
