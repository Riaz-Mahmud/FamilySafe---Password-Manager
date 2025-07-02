'use server';
/**
 * @fileOverview A flow to generate and "send" an email with credential details.
 *
 * - sendCredentialEmail - A function that handles generating the email content.
 * - SendCredentialEmailInput - The input type for the sendCredentialEmail function.
 * - SendCredentialEmailOutput - The return type for the sendCredentialEmail function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SendCredentialEmailInputSchema = z.object({
  emails: z.array(z.string().email()).describe('The list of email addresses to send the credential to.'),
  url: z.string().url().describe('The URL of the website for the credential.'),
  username: z.string().describe('The username for the credential.'),
  password: z.string().describe('The password for the credential.'),
});
export type SendCredentialEmailInput = z.infer<typeof SendCredentialEmailInputSchema>;

const SendCredentialEmailOutputSchema = z.object({
  success: z.boolean().describe('Whether the email was "sent" successfully.'),
  message: z.string().describe('A confirmation message about the simulation.'),
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

// This is a mock flow. In a real application, you would use a tool to call an email service like SendGrid or Mailgun.
// For this example, we will generate the email content and show it to the user to simulate the action.
const sendCredentialEmailFlow = ai.defineFlow(
  {
    name: 'sendCredentialEmailFlow',
    inputSchema: SendCredentialEmailInputSchema,
    outputSchema: SendCredentialEmailOutputSchema,
  },
  async (input) => {
    console.log(`Simulating sending email with credentials for ${input.url} to: ${input.emails.join(', ')}`);

    const {output} = await generateEmailContentPrompt(input);

    if (!output) {
      throw new Error('Failed to generate email content.');
    }

    return {
      success: true,
      message: `Email content generated for ${new URL(input.url).hostname}.`,
      emailSubject: output.subject,
      emailBody: output.body,
    };
  }
);
