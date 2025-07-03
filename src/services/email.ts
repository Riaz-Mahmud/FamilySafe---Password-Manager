'use server';

import sgMail from '@sendgrid/mail';

interface EmailInput {
  to: string | string[];
  subject: string;
  body: string;
}

interface EmailOutput {
  success: boolean;
  message: string;
}

/**
 * A centralized service for sending emails via SendGrid.
 * It includes robust configuration checks and error handling.
 */
export async function sendEmail({ to, subject, body }: EmailInput): Promise<EmailOutput> {
  const sendGridApiKey = process.env.SENDGRID_API_KEY;
  const sendGridFromEmail = process.env.SENDGRID_FROM_EMAIL;

  if (!sendGridApiKey || !sendGridFromEmail) {
    const errorMsg = 'Email service is not configured on the server. SENDGRID_API_KEY and/or SENDGRID_FROM_EMAIL are missing.';
    console.error(errorMsg);
    // Return a generic message to the client
    return {
      success: false,
      message: 'The email service is not configured on the server. Please contact support.',
    };
  }

  sgMail.setApiKey(sendGridApiKey);

  const msg = {
    to,
    from: sendGridFromEmail,
    subject,
    text: body,
    html: body.replace(/\n/g, '<br>'), // Simple conversion for HTML clients
    trackingSettings: {
      clickTracking: {
        enable: false,
      },
    },
  };

  try {
    await sgMail.send(msg);
    // Keep server log concise on success
    console.log(`Email sent successfully via SendGrid to: ${Array.isArray(to) ? to.join(', ') : to}`);
    return {
      success: true,
      message: 'Email sent successfully.',
    };
  } catch (error: any) {
    // Log the detailed error on the server for debugging
    console.error(`Error sending email to ${to} via SendGrid:`, JSON.stringify(error, null, 2));

    // Return a more specific, but still safe, error message to the client
    if (error.response) {
      const sendGridErrorBody = error.response.body;
      if (sendGridErrorBody?.errors?.length > 0) {
        const firstError = sendGridErrorBody.errors[0];
        if (firstError.message.includes('authorization')) {
          return {
            success: false,
            message: 'SendGrid Authorization Failed: Please check if your SENDGRID_API_KEY is correct and has the required permissions.',
          };
        }
        if (firstError.message.includes('does not match a verified Sender Identity')) {
          return {
            success: false,
            message: 'SendGrid Sender Error: The "from" email address has not been verified in your SendGrid account. Please complete sender verification.',
          };
        }
        return {
          success: false,
          message: `SendGrid Error: ${firstError.message}`,
        };
      }
    }
    return {
      success: false,
      message: 'An unexpected error occurred while sending the email. Please check the server logs for more details.',
    };
  }
}
