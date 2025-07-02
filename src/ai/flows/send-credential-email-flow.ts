'use server';
/**
 * @fileOverview A flow to generate and "send" an email with credential details.
 * This flow writes to a 'mail' collection in Firestore, which can be used
 * with the "Trigger Email" Firebase Extension to send real emails.
 *
 * - sendCredentialEmail - A function that handles generating the email content.
 * - SendCredentialEmailInput - The input type for the sendCredentialEmail function.
 * - SendCredentialEmailOutput - The return type for the sendCredentialEmail function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

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

// This flow now also writes to Firestore to trigger the "Trigger Email" Firebase Extension.
// The simulation dialog will still be shown to the user.
const sendCredentialEmailFlow = ai.defineFlow(
  {
    name: 'sendCredentialEmailFlow',
    inputSchema: SendCredentialEmailInputSchema,
    outputSchema: SendCredentialEmailOutputSchema,
  },
  async (input) => {
    const {output} = await generateEmailContentPrompt(input);

    if (!output) {
      throw new Error('Failed to generate email content.');
    }
    
    // This will trigger the Firebase Email Extension if it's installed.
    try {
      const mailCol = collection(db, 'mail');
      await addDoc(mailCol, {
        to: input.emails,
        message: {
          subject: output.subject,
          text: output.body,
        },
      });
      console.log('Email document added to Firestore "mail" collection.');
    } catch (error) {
        // Log the error but don't fail the whole flow, so the simulation can still be shown.
        console.error('Error writing email document to Firestore:', error);
    }

    return {
      success: true,
      message: `Email content generated for ${new URL(input.url).hostname}. If the Trigger Email extension is installed, an email will be sent.`,
      emailSubject: output.subject,
      emailBody: output.body,
    };
  }
);
