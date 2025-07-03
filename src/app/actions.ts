
'use server';

import { z } from 'zod';
import { sendCredentialEmail } from '@/ai/flows/send-credential-email-flow';
import { sendInvitationEmail } from '@/ai/flows/send-invitation-email-flow';
import { addCredential } from '@/services/firestore';

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

const ShareCredentialRecipientSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
});

const ShareCredentialDataSchema = z.object({
  url: z.string(),
  username: z.string(),
  password: z.string(),
  notes: z.string().optional(),
  icon: z.string(),
  tags: z.array(z.string()).optional(),
});

const ShareCredentialSchema = z.object({
  fromName: z.string(),
  toRecipients: z.array(ShareCredentialRecipientSchema),
  credential: ShareCredentialDataSchema,
});

export async function shareCredentialAction(data: z.infer<typeof ShareCredentialSchema>) {
  try {
    const parsedData = ShareCredentialSchema.safeParse(data);
    if (!parsedData.success) {
      console.error('Server Action Validation Error:', parsedData.error.flatten());
      return { success: false, message: 'Invalid input data for sharing.' };
    }

    const { fromName, toRecipients, credential } = parsedData.data;

    for (const recipient of toRecipients) {
      // Create a new credential object for the recipient
      const credentialForRecipient = {
        ...credential,
        notes: `Shared by ${fromName}.\n\n${credential.notes || ''}`,
        sharedWith: [], // A shared credential cannot be re-shared by the recipient
        isShared: true, // Mark that this credential was shared
        sharedTo: recipient.email, // Set recipient's email
      };
      
      // Add the credential to the recipient's account
      await addCredential(recipient.uid, credentialForRecipient);
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
