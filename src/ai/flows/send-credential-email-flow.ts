'use server';
/**
 * @fileOverview A flow to generate and send an email with credential details.
 * This flow now uses the centralized email service.
 *
 * - sendCredentialEmail - A function that handles generating and sending the email.
 * - SendCredentialEmailInput - The input type for the sendCredentialEmail function.
 * - SendCredentialEmailOutput - The return type for the sendCredentialEmail function.
 */

import { z } from 'zod';
import { sendEmail } from '@/services/email';

const SendCredentialEmailInputSchema = z.object({
  emails: z.array(z.string().email()).describe('The list of email addresses to send the credential to.'),
  url: z.string().describe('The URL or name of the website/application for the credential.'),
  username: z.string().describe('The username for the credential.'),
  password: z.string().describe('The password for the credential.'),
});
export type SendCredentialEmailInput = z.infer<typeof SendCredentialEmailInputSchema>;

const SendCredentialEmailOutputSchema = z.object({
  success: z.boolean().describe('Whether the email was sent successfully.'),
  message: z.string().describe('A confirmation message.'),
});
export type SendCredentialEmailOutput = z.infer<typeof SendCredentialEmailOutputSchema>;

export async function sendCredentialEmail(input: SendCredentialEmailInput): Promise<SendCredentialEmailOutput> {
  const emailContent = {
    subject: `Your credentials for ${input.url}`,
    body: `Hello,\n\nHere are the credential details for ${input.url}, shared from your FamilySafe account:\n\nWebsite/Application: ${input.url}\nUsername: ${input.username}\nPassword: ${input.password}\n\nRegards,\nThe FamilySafe Team`
  };

  const result = await sendEmail({
    to: input.emails,
    subject: emailContent.subject,
    body: emailContent.body
  });

  if (result.success) {
    return {
      success: true,
      message: `An email with the credentials for ${input.url} has been sent to the selected recipients.`,
    };
  } else {
    // The specific error message from the email service is passed through.
    return result;
  }
}
