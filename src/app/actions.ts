
'use server';

import { z } from 'zod';
import { sendCredentialEmail } from '@/ai/flows/send-credential-email-flow';
import { sendInvitationEmail } from '@/ai/flows/send-invitation-email-flow';

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
