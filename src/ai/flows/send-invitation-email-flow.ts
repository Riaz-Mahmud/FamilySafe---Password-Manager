'use server';
/**
 * @fileOverview A flow to send an invitation email to a new family member.
 * This flow sends a real email using SendGrid if configured.
 *
 * - sendInvitationEmail - A function that handles sending the invitation.
 * - SendInvitationEmailInput - The input type for the sendInvitationEmail function.
 * - SendInvitationEmailOutput - The return type for the sendInvitationEmail function.
 */

import { z } from 'zod';
import sgMail from '@sendgrid/mail';

const SendInvitationEmailInputSchema = z.object({
  email: z.string().email().describe('The email address of the person to invite.'),
  referrerName: z.string().describe('The name of the person sending the invitation.'),
  referralLink: z.string().url().describe('The unique referral link for the new user to sign up.'),
});
export type SendInvitationEmailInput = z.infer<typeof SendInvitationEmailInputSchema>;

const SendInvitationEmailOutputSchema = z.object({
  success: z.boolean().describe('Whether the email was sent successfully.'),
  message: z.string().describe('A confirmation message.'),
});
export type SendInvitationEmailOutput = z.infer<typeof SendInvitationEmailOutputSchema>;

export async function sendInvitationEmail(input: SendInvitationEmailInput): Promise<SendInvitationEmailOutput> {
  const emailContent = {
    subject: `You're invited to join FamilySafe!`,
    body: `Hello,\n\n${input.referrerName} has invited you to join their family group on FamilySafe, a secure password manager.\n\nClick the link below to create your account and get started:\n${input.referralLink}\n\nWelcome aboard,\nThe FamilySafe Team`
  };

  const sendGridApiKey = process.env.SENDGRID_API_KEY;
  const sendGridFromEmail = process.env.SENDGRID_FROM_EMAIL;
  
  if (!sendGridApiKey || !sendGridFromEmail) {
    console.warn('SendGrid API Key or From Email not found in environment variables. Invitation email will not be sent.');
    return {
      success: false,
      message: 'Email service is not configured on the server. Could not send invitation email.',
    };
  }

  sgMail.setApiKey(sendGridApiKey);
  const msg = {
      to: input.email,
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
      console.log('Invitation email sent successfully via SendGrid.');
      return {
        success: true,
        message: `An invitation email has been sent to ${input.email}.`,
      };
  } catch (error: any) {
      console.error('Error sending invitation email via SendGrid:', error);
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
          message: 'An unexpected error occurred while sending the invitation email. Please check the server logs for more details.' 
      };
  }
}
