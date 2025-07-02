'use server';
/**
 * @fileOverview A flow to generate and send an email with credential details.
 * This flow sends a real email using SendGrid if configured, otherwise
 * it returns the content for simulation.
 *
 * - sendCredentialEmail - A function that handles generating and sending the email.
 * - SendCredentialEmailInput - The input type for the sendCredentialEmail function.
 * - SendCredentialEmailOutput - The return type for the sendCredentialEmail function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import sgMail from '@sendgrid/mail';

const SendCredentialEmailInputSchema = z.object({
  emails: z.array(z.string().email()).describe('The list of email addresses to send the credential to.'),
  url: z.string().url().describe('The URL of the website for the credential.'),
  username: z.string().describe('The username for the credential.'),
  password: z.string().describe('The password for the credential.'),
});
export type SendCredentialEmailInput = z.infer<typeof SendCredentialEmailInputSchema>;

const SendCredentialEmailOutputSchema = z.object({
  success: z.boolean().describe('Whether the email was sent successfully.'),
  message: z.string().describe('A confirmation message.'),
  emailSubject: z.string().describe('The subject line of the generated email.'),
  emailBody: z.string().describe('The body content of the generated email.'),
});
export type SendCredentialEmailOutput = z.infer<typeof SendCredentialEmailOutputSchema>;

export async function sendCredentialEmail(input: SendCredentialEmailInput): Promise<SendCredentialEmailOutput> {
  return sendCredentialEmailFlow(input);
}

const EmailContentSchema = z.object({
  subject: z.string().describe('The subject line for the email.'),
  body: z.string().describe('The body content for the email, formatted for plain text.'),
});

const generateEmailContentPrompt = ai.definePrompt({
  name: 'generateEmailContentPrompt',
  input: {schema: SendCredentialEmailInputSchema},
  output: {schema: EmailContentSchema},
  prompt: `You are an AI assistant for a family password manager called FamilySafe. Your task is to generate the content for an email that shares credential details.

The email should be professional, clear, and friendly.

It should contain the following information:
- Website URL: {{{url}}}
- Username: {{{username}}}
- Password: {{{password}}}

Generate a subject line and a body for the email.
The subject should be clear, like "Your credentials for [Website Name]".
The body should state that the credentials are being shared from a FamilySafe account and should clearly list the URL, username, and password. Add a friendly closing.
Do not include the recipient's name in the body, as it will be sent to multiple people.`,
});

const sendCredentialEmailFlow = ai.defineFlow(
  {
    name: 'sendCredentialEmailFlow',
    inputSchema: SendCredentialEmailInputSchema,
    outputSchema: SendCredentialEmailOutputSchema,
  },
  async (input) => {
    const {output: emailContent} = await generateEmailContentPrompt(input);

    if (!emailContent) {
      throw new Error('Failed to generate email content.');
    }

    const sendGridApiKey = process.env.SENDGRID_API_KEY;
    const sendGridFromEmail = process.env.SENDGRID_FROM_EMAIL;
    let message = '';

    if (sendGridApiKey && sendGridFromEmail) {
        sgMail.setApiKey(sendGridApiKey);
        const msg = {
            to: input.emails,
            from: sendGridFromEmail,
            subject: emailContent.subject,
            text: emailContent.body,
        };

        try {
            await sgMail.send(msg);
            console.log('Credential email sent successfully via SendGrid.');
            message = `An email with the credentials for ${new URL(input.url).hostname} has been sent to the selected recipients.`;
        } catch (error) {
            console.error('Error sending email via SendGrid:', error);
            // Don't fail the whole flow, just log the error and update the message
            message = `There was an error sending the email via SendGrid. Please check server logs. The generated content is available for review.`;
        }

    } else {
      console.warn('SendGrid API Key or From Email not found in environment variables. Email will not be sent.');
      message = `Email sending is not configured. This is a simulation of the email that would be sent for ${new URL(input.url).hostname}.`;
    }

    return {
      success: true,
      message, // This message will be used in the toast/alert.
      emailSubject: emailContent.subject,
      emailBody: emailContent.body,
    };
  }
);
