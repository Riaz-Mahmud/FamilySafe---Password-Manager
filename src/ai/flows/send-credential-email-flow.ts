'use server';
/**
 * @fileOverview A flow to generate and send an email with credential details.
 * This flow sends a real email using SendGrid if configured.
 *
 * - sendCredentialEmail - A function that handles generating and sending the email.
 * - SendCredentialEmailInput - The input type for the sendCredentialEmail function.
 * - SendCredentialEmailOutput - The return type for the sendCredentialEmail function.
 */

import { z } from 'zod';
import sgMail from '@sendgrid/mail';

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

  const sendGridApiKey = process.env.SENDGRID_API_KEY;
  const sendGridFromEmail = process.env.SENDGRID_FROM_EMAIL;
  
  if (!sendGridApiKey || !sendGridFromEmail) {
    console.warn('SendGrid API Key or From Email not found in environment variables. Email will not be sent.');
    return {
      success: false,
      message: 'Email service is not configured on the server. Could not send email.',
    };
  }

  sgMail.setApiKey(sendGridApiKey);
  const msg = {
      to: input.emails,
      from: sendGridFromEmail,
      subject: emailContent.subject,
      text: emailContent.body,
      trackingSettings: {
        clickTracking: {
          enable: false,
        },
      },
  };

  try {
      await sgMail.send(msg);
      console.log('Credential email sent successfully via SendGrid.');
      return {
        success: true,
        message: `An email with the credentials for ${input.url} has been sent to the selected recipients.`,
      };
  } catch (error: any) {
      console.error('Error sending email via SendGrid:', error);
       if (error.response) {
          const sendGridErrorBody = error.response.body;
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
      }
      return { 
          success: false, 
          message: 'An unexpected error occurred while sending the email. Please check the server logs for more details.' 
      };
  }
}
