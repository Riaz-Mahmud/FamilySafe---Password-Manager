
'use server';

import { z } from 'zod';
import { sendCredentialEmail } from '@/ai/flows/send-credential-email-flow';
import { sendInvitationEmail } from '@/ai/flows/send-invitation-email-flow';
import { recoverAccount } from '@/services/recovery';
import { shareItemAndNotify } from '@/services/sharing';
import { checkPasswordStrength, type PasswordStrengthOutput } from '@/ai/flows/password-strength-checker';

const SendEmailSchema = z.object({
  emails: z.array(z.string().email()),
  url: z.string(),
  username: z.string(),
  password: z.string(),
});

export async function sendCredentialEmailAction(data: z.infer<typeof SendEmailSchema>) {
  try {
    const parsedData = SendEmailSchema.safeParse(data);

    if (!parsedData.success) {
      console.error('Server Action Validation Error:', parsedData.error.flatten());
      return { success: false, message: 'Invalid input data provided.' };
    }

    // Call the Genkit flow
    const result = await sendCredentialEmail(parsedData.data);
    return result;

  } catch (error: any) {
    console.error('Error in sendCredentialEmailAction:', error);
    return { 
      success: false, 
      message: 'An unexpected error occurred while processing your request. Please check the server logs.' 
    };
  }
}

const SendInvitationSchema = z.object({
  email: z.string().email(),
  referrerName: z.string(),
  referralLink: z.string().url(),
});

export async function sendInvitationEmailAction(data: z.infer<typeof SendInvitationSchema>) {
  try {
    const parsedData = SendInvitationSchema.safeParse(data);

    if (!parsedData.success) {
      console.error('Server Action Validation Error:', parsedData.error.flatten());
      return { success: false, message: 'Invalid input data for invitation.' };
    }

    const result = await sendInvitationEmail(parsedData.data);
    return result;

  } catch (error: any) {
    console.error('Error in sendInvitationEmailAction:', error);
    return { 
      success: false, 
      message: 'An unexpected error occurred while sending the invitation. Please check the server logs.' 
    };
  }
}

const RecoverAccountSchema = z.object({
  email: z.string().email(),
  secretKey: z.string(),
});

export async function recoverAccountAction(data: z.infer<typeof RecoverAccountSchema>) {
  try {
    const parsedData = RecoverAccountSchema.safeParse(data);

    if (!parsedData.success) {
      console.error('Server Action Validation Error:', parsedData.error.flatten());
      return { success: false, message: 'Invalid input data provided.' };
    }

    // Call the recovery service and return its result directly to the client.
    // This provides detailed feedback for debugging configuration issues.
    const result = await recoverAccount(parsedData.data);
    return result;

  } catch (error: any) {
    console.error('Error in recoverAccountAction:', error);
    return { 
      success: false, 
      message: 'An unexpected error occurred while processing your request.' 
    };
  }
}

const ShareItemServerSchema = z.object({
  recipientUid: z.string(),
  itemType: z.enum(['credential', 'document', 'memory']),
  itemData: z.any(),
  notificationData: z.any(),
});

export async function shareItemAction(data: z.infer<typeof ShareItemServerSchema>) {
    try {
        const parsedData = ShareItemServerSchema.safeParse(data);
        if (!parsedData.success) {
            return { success: false, message: 'Invalid input for sharing.' };
        }
        return await shareItemAndNotify(parsedData.data);
    } catch (error: any) {
        console.error('Error in shareItemAction:', error);
        return { 
            success: false, 
            message: 'An unexpected error occurred while sharing.' 
        };
    }
}


export async function checkPasswordStrengthAction(password: string): Promise<PasswordStrengthOutput> {
  // We can call the flow directly. Zod will handle validation inside the flow.
  return await checkPasswordStrength(password);
}
