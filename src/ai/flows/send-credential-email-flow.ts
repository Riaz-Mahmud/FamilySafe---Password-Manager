'use server';
/**
 * @fileOverview A flow to generate and send an email with credential details.
 * This flow sends a real email using SendGrid if configured.
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
- Website/Application: {{{url}}}
- Username: {{{username}}}
- Password: {{{password}}}

Generate a subject line and a body for the email.
The subject should be clear, like "Your credentials for [Website Name]".
The body should state that the credentials are being shared from a FamilySafe account and should clearly list the URL/Name, username, and password. Add a friendly closing.
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
      return { success: false, message: 'Failed to generate email content.' };
    }

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
);
