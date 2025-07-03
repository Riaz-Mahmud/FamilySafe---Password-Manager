'use server';
/**
 * @fileOverview A flow to send an invitation email to a new family member.
 * This flow now uses the centralized email service.
 *
 * - sendInvitationEmail - A function that handles sending the invitation.
 * - SendInvitationEmailInput - The input type for the sendInvitationEmail function.
 * - SendInvitationEmailOutput - The return type for the sendInvitationEmail function.
 */

import { z } from 'zod';
import { sendEmail } from '@/services/email';

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

  const result = await sendEmail({
      to: input.email,
      subject: emailContent.subject,
      body: emailContent.body,
  });

  if (result.success) {
      return {
        success: true,
        message: `An invitation email has been sent to ${input.email}.`,
      };
  } else {
    // The specific error message from the email service is passed through.
    return result;
  }
}
