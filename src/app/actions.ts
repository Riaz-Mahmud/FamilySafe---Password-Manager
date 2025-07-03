
'use server';

import { z } from 'zod';
import { sendCredentialEmail } from '@/ai/flows/send-credential-email-flow';
import { sendInvitationEmail } from '@/ai/flows/send-invitation-email-flow';
import { recoverAccount } from '@/services/recovery';

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
      // Return a generic error to the client to prevent leaking validation details.
      return { success: false, message: 'Invalid input data provided.' };
    }

    // Call the recovery service
    const result = await recoverAccount(parsedData.data);
    // We don't return the direct result to the client for security reasons (to prevent enumeration attacks).
    // The client will always show a generic success message. The result is logged on the server.
    if (result.success) {
      console.log(`Recovery email sent for: ${data.email}`);
    } else {
      console.warn(`Failed recovery attempt for ${data.email}: ${result.message}`);
    }
    
    // Always return a consistent response to the client.
    return { success: true, message: 'Recovery process initiated.' };

  } catch (error: any) {
    console.error('Error in recoverAccountAction:', error);
    return { 
      success: false, 
      message: 'An unexpected error occurred while processing your request.' 
    };
  }
}
