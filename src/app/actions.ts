
'use server';

import { z } from 'zod';
import { sendCredentialEmail } from '@/ai/flows/send-credential-email-flow';
import { sendInvitationEmail } from '@/ai/flows/send-invitation-email-flow';
import { createShare } from '@/services/firestore';

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

const ShareCredentialSchema = z.object({
  fromUid: z.string(),
  fromName: z.string(),
  toEmails: z.array(z.string().email()),
  credential: z.object({
    url: z.string(),
    username: z.string(),
    password: z.string(),
    notes: z.string().optional(),
    icon: z.string(),
    tags: z.array(z.string()).optional(),
    expiryMonths: z.number().optional(),
    safeForTravel: z.boolean().optional(),
  }),
});

export async function shareCredentialAction(data: z.infer<typeof ShareCredentialSchema>) {
  try {
    const parsedData = ShareCredentialSchema.safeParse(data);
    if (!parsedData.success) {
      console.error('Server Action Validation Error:', parsedData.error.flatten());
      return { success: false, message: 'Invalid input data for sharing.' };
    }

    const { fromUid, fromName, toEmails, credential } = parsedData.data;

    for (const email of toEmails) {
      // Create a temporary, unencrypted share document.
      // The recipient will claim, encrypt, and delete this.
      await createShare({
        fromUid,
        fromName,
        toEmail: email,
        credential,
      });
    }

    return { success: true, message: 'Credential shared successfully.' };

  } catch (error: any) {
    console.error('Error in shareCredentialAction:', error);
    return { 
      success: false, 
      message: 'An unexpected error occurred while sharing the credential. Please check the server logs.' 
    };
  }
}
