'use server';

import sgMail from '@sendgrid/mail';
import { z } from 'zod';

const SendEmailSchema = z.object({
  emails: z.array(z.string().email()),
  url: z.string().url(),
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

    const { emails, url, username, password } = parsedData.data;

    const sendGridApiKey = process.env.SENDGRID_API_KEY;
    const sendGridFromEmail = process.env.SENDGRID_FROM_EMAIL;

    if (!sendGridApiKey || !sendGridFromEmail) {
      console.error('SendGrid API Key or From Email not found in environment variables.');
      return { success: false, message: 'Email service is not configured on the server. Could not send email.' };
    }

    sgMail.setApiKey(sendGridApiKey);

    const siteName = new URL(url).hostname;
    const subject = `Your credentials for ${siteName}`;
    const body = `Hello,

Here are the shared credentials from your FamilySafe account:

Website: ${url}
Username: ${username}
Password: ${password}

Regards,
The FamilySafe Team`;

    const msg = {
      to: emails,
      from: sendGridFromEmail,
      subject: subject,
      text: body,
    };

    await sgMail.send(msg);
    console.log(`Credential email sent successfully via SendGrid to: ${emails.join(', ')}`);
    return {
      success: true,
      message: `An email with the credentials for ${siteName} has been sent to the selected recipients.`,
    };
  } catch (error: any) {
    console.error('Error in sendCredentialEmailAction:', error);
    return { 
      success: false, 
      message: 'An unexpected error occurred while sending the email. Please check the server logs for more details.' 
    };
  }
}
