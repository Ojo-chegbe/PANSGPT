import nodemailer from 'nodemailer';

// Email addresses based on purpose
export const EMAIL_ADDRESSES = {
  HELLO: 'hello@pansgpt.site',
  SUPPORT: 'support@pansgpt.site',
  UPDATES: 'updates@pansgpt.site',
  NO_REPLY: 'no-reply@pansgpt.site',
};

// Zoho SMTP Configuration
// These should be set in your environment variables:
// ZOHO_EMAIL: no-reply@pansgpt.site (for system notifications)
// ZOHO_PASSWORD: App password for no-reply@pansgpt.site
// ZOHO_UPDATES_EMAIL: updates@pansgpt.site (for welcome emails)
// ZOHO_UPDATES_PASSWORD: App password for updates@pansgpt.site
// ZOHO_SMTP_PORT: 465 (default, uses SSL) or 587 (for TLS)
// Note: Use app passwords, not regular login passwords

// Create reusable transporters for different accounts
let defaultTransporter: nodemailer.Transporter | null = null;
let updatesTransporter: nodemailer.Transporter | null = null;

async function getDefaultTransporter(): Promise<nodemailer.Transporter> {
  if (!defaultTransporter) {
    // Validate configuration
    if (!process.env.ZOHO_EMAIL || !process.env.ZOHO_PASSWORD) {
      console.error('ZOHO_EMAIL:', process.env.ZOHO_EMAIL ? 'SET' : 'NOT SET');
      console.error('ZOHO_PASSWORD:', process.env.ZOHO_PASSWORD ? 'SET' : 'NOT SET');
      throw new Error('ZOHO_EMAIL and ZOHO_PASSWORD environment variables must be set');
    }

    const port = parseInt(process.env.ZOHO_SMTP_PORT || '465', 10);
    const useSSL = port === 465;

    // Log configuration (without exposing password)
    console.log('Creating email transporter:', {
      host: 'smtp.zoho.com',
      port,
      secure: useSSL,
      email: process.env.ZOHO_EMAIL,
      passwordSet: !!process.env.ZOHO_PASSWORD,
      passwordLength: process.env.ZOHO_PASSWORD?.length || 0
    });

    // Try different configurations based on port
    const transportConfig: any = {
      host: 'smtp.zoho.com',
      port: port,
      secure: useSSL,
      auth: {
        user: process.env.ZOHO_EMAIL.trim(),
        pass: process.env.ZOHO_PASSWORD.trim(),
      },
    };

    // For port 465 (SSL), use secure: true
    // For port 587 (TLS), use secure: false with requireTLS
    if (port === 587) {
      transportConfig.requireTLS = true;
      transportConfig.tls = {
        rejectUnauthorized: false,
        ciphers: 'SSLv3'
      };
    } else if (port === 465) {
      transportConfig.tls = {
        rejectUnauthorized: false,
      };
    }

    defaultTransporter = nodemailer.createTransport(transportConfig);
    
    // Test the connection
    try {
      await defaultTransporter.verify();
      console.log('✓ Email transporter verified successfully');
    } catch (verifyError: any) {
      console.error('✗ Email transporter verification failed:', verifyError.message);
      // Don't throw here, let it fail on actual send
    }
  }
  return defaultTransporter;
}

async function getUpdatesTransporter(): Promise<nodemailer.Transporter | null> {
  // Only create if credentials are provided
  if (!updatesTransporter && process.env.ZOHO_UPDATES_EMAIL && process.env.ZOHO_UPDATES_PASSWORD) {
    const port = parseInt(process.env.ZOHO_SMTP_PORT || '465', 10);
    const useSSL = port === 465;

    // Log configuration (without exposing password)
    console.log('Creating updates email transporter:', {
      host: 'smtp.zoho.com',
      port,
      secure: useSSL,
      email: process.env.ZOHO_UPDATES_EMAIL,
      passwordSet: !!process.env.ZOHO_UPDATES_PASSWORD,
      passwordLength: process.env.ZOHO_UPDATES_PASSWORD?.length || 0
    });

    // Try different configurations based on port
    const transportConfig: any = {
      host: 'smtp.zoho.com',
      port: port,
      secure: useSSL,
      auth: {
        user: process.env.ZOHO_UPDATES_EMAIL.trim(),
        pass: process.env.ZOHO_UPDATES_PASSWORD.trim(),
      },
    };

    // For port 465 (SSL), use secure: true
    // For port 587 (TLS), use secure: false with requireTLS
    if (port === 587) {
      transportConfig.requireTLS = true;
      transportConfig.tls = {
        rejectUnauthorized: false,
        ciphers: 'SSLv3'
      };
    } else if (port === 465) {
      transportConfig.tls = {
        rejectUnauthorized: false,
      };
    }

    updatesTransporter = nodemailer.createTransport(transportConfig);
    
    // Test the connection
    try {
      await updatesTransporter.verify();
      console.log('✓ Updates email transporter verified successfully');
    } catch (verifyError: any) {
      console.error('✗ Updates email transporter verification failed:', verifyError.message);
      // Don't throw here, let it fail on actual send
    }
  }
  return updatesTransporter;
}

interface SendEmailOptions {
  to: string | string[];
  from?: string; // Optional, defaults to ZOHO_EMAIL. Can include display name: "Display Name <email@domain.com>"
  replyTo?: string; // Optional Reply-To header
  subject: string;
  text: string;
  html?: string;
  useUpdatesAccount?: boolean; // If true, use ZOHO_UPDATES_EMAIL for authentication
}

/**
 * Send an email using Zoho Mail SMTP
 */
export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Choose transporter based on useUpdatesAccount flag
    let transporter: nodemailer.Transporter;
    if (options.useUpdatesAccount) {
      const updatesTrans = await getUpdatesTransporter();
      if (!updatesTrans) {
        throw new Error('ZOHO_UPDATES_EMAIL and ZOHO_UPDATES_PASSWORD must be set to use updates account');
      }
      transporter = updatesTrans;
    } else {
      transporter = await getDefaultTransporter();
    }
    
    // Handle from address - if it already includes <, use as is; otherwise format it
    let fromEmail: string;
    if (options.from) {
      fromEmail = options.from.includes('<') ? options.from : `PansGPT <${options.from}>`;
    } else {
      const defaultFrom = options.useUpdatesAccount 
        ? (process.env.ZOHO_UPDATES_EMAIL || EMAIL_ADDRESSES.UPDATES)
        : (process.env.ZOHO_EMAIL || EMAIL_ADDRESSES.HELLO);
      fromEmail = `PansGPT <${defaultFrom}>`;
    }
    
    const mailOptions: any = {
      from: fromEmail,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      text: options.text,
      html: options.html || options.text,
    };

    // Add Reply-To header if provided
    if (options.replyTo) {
      mailOptions.replyTo = options.replyTo;
    }

    const info = await transporter.sendMail(mailOptions);
    
    console.log('Email sent successfully:', info.messageId);
    
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    console.error('Error sending email:', error);
    console.error('Error details:', {
      code: error.code,
      response: error.response,
      responseCode: error.responseCode,
      command: error.command,
      message: error.message
    });
    
    // Provide more detailed error messages
    let errorMessage = 'Failed to send email';
    if (error.code === 'EAUTH' || error.responseCode === 535) {
      errorMessage = 'Email authentication failed. Please verify:\n' +
        '1. ZOHO_EMAIL and ZOHO_PASSWORD are set correctly in .env\n' +
        '2. You are using an app-specific password (not your regular password)\n' +
        '3. The email account is properly configured in Zoho Mail\n' +
        '4. Two-factor authentication is enabled and app password is generated';
      console.error('Authentication failed. Check:', {
        email: process.env.ZOHO_EMAIL ? 'SET' : 'NOT SET',
        password: process.env.ZOHO_PASSWORD ? 'SET (length: ' + process.env.ZOHO_PASSWORD.length + ')' : 'NOT SET',
        port: process.env.ZOHO_SMTP_PORT || '465 (default)'
      });
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Could not connect to email server. Please check your internet connection and Zoho SMTP settings.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Send a personalized welcome email from the founders
 * This is sent after successful email verification
 */
export async function sendWelcomeEmail(
  studentName: string,
  studentEmail: string,
  loginUrl: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const plainText = `Hi ${studentName},

We just saw you signed up and wanted to personally welcome you to the Pharmily.

We built PansGPT together because we know exactly how crazy pharmacy school can get between the pharmacology notes, the bulky PDFs, and the endless reading, we knew there had to be a smarter way to study.

We have one quick question for you:
What is the one topic or course giving you the biggest headache right now?

Hit reply and let us know. We read every email that comes in, and your answer actually helps us decide what features or study guides to build next.

Happy studying,

Co-founders, PansGPT

---

Ready to get started? Log in here: ${loginUrl}`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
  <title>Welcome to PansGPT</title>
  <!--[if mso]>
  <style type="text/css">
    table {border-collapse:collapse;border-spacing:0;margin:0;}
    div, td {padding:0;}
    div {margin:0 !important;}
  </style>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; width: 100%; word-wrap: break-word; -webkit-font-smoothing: antialiased; background-color: #f5f5f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0; padding: 0; width: 100%; background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center; background-color: #ffffff; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #10b981; font-size: 28px; font-weight: 600; line-height: 1.2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Welcome to the Pharmily!</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 30px 40px; background-color: #ffffff;">
              <p style="margin: 0 0 16px 0; color: #333333; font-size: 16px; line-height: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Hi ${studentName},</p>
              <p style="margin: 0 0 24px 0; color: #333333; font-size: 16px; line-height: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">We just saw you signed up and wanted to personally welcome you to the Pharmily.</p>
              <p style="margin: 0 0 24px 0; color: #333333; font-size: 16px; line-height: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">We built PansGPT together because we know exactly how crazy pharmacy school can get between the pharmacology notes, the bulky PDFs, and the endless reading, we knew there had to be a smarter way to study.</p>
              <p style="margin: 0 0 16px 0; color: #333333; font-size: 16px; line-height: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">We have one quick question for you:</p>
              <p style="margin: 0 0 24px 0; color: #333333; font-size: 16px; line-height: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-weight: 600;">What is the one topic or course giving you the biggest headache right now?</p>
              <p style="margin: 0 0 24px 0; color: #333333; font-size: 16px; line-height: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Hit reply and let us know. We read every email that comes in, and your answer actually helps us decide what features or study guides to build next.</p>
            </td>
          </tr>
          <!-- Get Started Section -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f0fdf4; border-top: 1px solid #dcfce7;">
              <p style="margin: 0 0 12px 0; color: #166534; font-size: 14px; font-weight: 600; line-height: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Ready to Get Started?</p>
              <p style="margin: 0 0 16px 0; color: #166534; font-size: 14px; line-height: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Your email is verified! You can now log in and start using PansGPT:</p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                <tr>
                  <td align="center" style="background-color: #10b981; border-radius: 6px;">
                    <a href="${loginUrl}" style="display: inline-block; padding: 12px 24px; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; line-height: 1.5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Log In to PansGPT</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; border-top: 1px solid #eeeeee; background-color: #fafafa; border-radius: 0 0 8px 8px;">
              <p style="margin: 0 0 8px 0; color: #333333; font-size: 16px; line-height: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Happy studying,</p>
              <p style="margin: 0; color: #333333; font-size: 16px; line-height: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-weight: 600;">Co-founders, PansGPT</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return sendEmail({
    from: 'The Founders <updates@pansgpt.site>',
    to: studentEmail,
    replyTo: EMAIL_ADDRESSES.HELLO,
    subject: 'Welcome to PansGPT! 🎓',
    text: plainText,
    html: htmlContent,
    useUpdatesAccount: true, // Use updates@pansgpt.site for authentication
  });
}

/**
 * Verify the email configuration by testing the connection
 */
export async function verifyEmailConfig(): Promise<boolean> {
  try {
    const transporter = await getDefaultTransporter();
    await transporter.verify();
    console.log('Email server is ready to send messages');
    
    // Also verify updates account if configured
    const updatesTrans = await getUpdatesTransporter();
    if (updatesTrans) {
      await updatesTrans.verify();
      console.log('Updates email account verified');
    }
    
    return true;
  } catch (error: any) {
    console.error('Email configuration verification failed:', error);
    return false;
  }
}

