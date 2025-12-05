import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

// Use verified domain email or fallback to Resend's test domain
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'PansGPT <onboarding@resend.dev>';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true }
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({ 
        success: true, 
        message: "If an account with that email exists, a password reset link has been sent." 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hour from now

    // Store reset token in database
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: resetToken,
        expires
      }
    });

    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured. Password reset email cannot be sent.');
      return NextResponse.json({ 
        error: "Email service is not configured. Please contact support." 
      }, { status: 500 });
    }

    // Send reset email
    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    try {
      const plainText = `Password Reset Request

Hi ${user.name || 'there'},

We received a request to reset your password for your PansGPT account. Click the link below to reset your password:

${resetUrl}

This link will expire in 1 hour for security reasons.

If the link doesn't work, copy and paste it into your browser.

If you didn't request this password reset, please ignore this email. Your password will remain unchanged.

Best regards,
The PansGPT Team`;

      const { data: emailData, error: emailError } = await resend.emails.send({
        from: FROM_EMAIL,
        to: user.email, // Send to the user's actual email
        subject: 'Reset your PansGPT password',
        text: plainText,
        html: `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
  <title>Reset your PansGPT password</title>
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
              <h1 style="margin: 0; color: #10b981; font-size: 28px; font-weight: 600; line-height: 1.2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Password Reset Request</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 30px 40px; background-color: #ffffff;">
              <p style="margin: 0 0 16px 0; color: #333333; font-size: 16px; line-height: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Hi ${user.name || 'there'},</p>
              <p style="margin: 0 0 24px 0; color: #333333; font-size: 16px; line-height: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">We received a request to reset your password for your PansGPT account. Click the button below to reset your password:</p>
            </td>
          </tr>
          <!-- Button -->
          <tr>
            <td style="padding: 0 40px 30px 40px; text-align: center; background-color: #ffffff;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                <tr>
                  <td align="center" style="background-color: #10b981; border-radius: 6px;">
                    <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; line-height: 1.5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Reset Password</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Link fallback -->
          <tr>
            <td style="padding: 0 40px 20px 40px; background-color: #ffffff;">
              <p style="margin: 0 0 12px 0; color: #666666; font-size: 14px; line-height: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="margin: 0; word-break: break-all; color: #10b981; background-color: #f0fdf4; padding: 12px; border-radius: 4px; font-size: 13px; font-family: 'Courier New', Courier, monospace; line-height: 1.5;">${resetUrl}</p>
            </td>
          </tr>
          <!-- Footer info -->
          <tr>
            <td style="padding: 0 40px 30px 40px; background-color: #ffffff;">
              <p style="margin: 0 0 12px 0; color: #666666; font-size: 14px; line-height: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">This link will expire in 1 hour for security reasons.</p>
              <p style="margin: 0; color: #666666; font-size: 14px; line-height: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; border-top: 1px solid #eeeeee; background-color: #fafafa; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; color: #999999; font-size: 13px; line-height: 18px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Best regards,<br><strong style="color: #333333;">The PansGPT Team</strong></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
      });

      if (emailError) {
        console.error('Resend API Error sending reset email:', JSON.stringify(emailError, null, 2));
        return NextResponse.json({ 
          error: "Failed to send reset email. Please try again later." 
        }, { status: 500 });
      }

      console.log('Password reset email sent successfully:', emailData?.id || 'sent', 'to:', user.email);
    } catch (emailSendError: any) {
      console.error('Exception sending reset email:', emailSendError);
      return NextResponse.json({ 
        error: "Failed to send reset email. Please try again later." 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "If an account with that email exists, a password reset link has been sent." 
    });

  } catch (error) {
    console.error('Error in forgot password:', error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}
