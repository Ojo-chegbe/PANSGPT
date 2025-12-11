import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, EMAIL_ADDRESSES } from "@/lib/email-service";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if user already exists and is verified
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, emailVerified: true }
    });

    if (existingUser) {
      if (existingUser.emailVerified) {
        return NextResponse.json({ 
          success: true, 
          message: "This email is already verified. You can log in." 
        });
      } else {
        // This shouldn't happen with new flow, but handle it
        return NextResponse.json({ 
          success: true, 
          message: "Please sign up again to receive a new verification email." 
        });
      }
    }

    // Find pending signup
    const pendingSignup = await prisma.pendingSignup.findUnique({
      where: { email }
    });

    if (!pendingSignup) {
      // Don't reveal if pending signup exists or not for security
      return NextResponse.json({ 
        success: true, 
        message: "If an account with that email exists and is not verified, a verification email has been sent." 
      });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update pending signup with new token
    await prisma.pendingSignup.update({
      where: { id: pendingSignup.id },
      data: {
        verificationToken,
        verificationTokenExpires
      }
    });

    const userName = pendingSignup.name;

    // Send verification email
    const verificationUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
    
    const plainText = `Verify Your PansGPT Account

Hi ${userName || 'there'},

You requested a new verification email. Please click the link below to verify your email address:

${verificationUrl}

This verification link will expire in 24 hours.

If the link doesn't work, copy and paste it into your browser.

If you didn't request this verification email, please ignore it.

Best regards,
The PansGPT Team`;

    const emailResult = await sendEmail({
      from: EMAIL_ADDRESSES.NO_REPLY,
      to: email,
      subject: 'Verify your PansGPT account',
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
  <title>Verify your PansGPT account</title>
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
              <h1 style="margin: 0; color: #10b981; font-size: 28px; font-weight: 600; line-height: 1.2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Verify Your PansGPT Account</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 30px 40px; background-color: #ffffff;">
              <p style="margin: 0 0 16px 0; color: #333333; font-size: 16px; line-height: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Hi ${userName || 'there'},</p>
              <p style="margin: 0 0 24px 0; color: #333333; font-size: 16px; line-height: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">You requested a new verification email. Please click the button below to verify your email address:</p>
            </td>
          </tr>
          <!-- Button -->
          <tr>
            <td style="padding: 0 40px 30px 40px; text-align: center; background-color: #ffffff;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                <tr>
                  <td align="center" style="background-color: #10b981; border-radius: 6px;">
                    <a href="${verificationUrl}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; line-height: 1.5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Verify Email Address</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Link fallback -->
          <tr>
            <td style="padding: 0 40px 20px 40px; background-color: #ffffff;">
              <p style="margin: 0 0 12px 0; color: #666666; font-size: 14px; line-height: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="margin: 0; word-break: break-all; color: #10b981; background-color: #f0fdf4; padding: 12px; border-radius: 4px; font-size: 13px; font-family: 'Courier New', Courier, monospace; line-height: 1.5;">${verificationUrl}</p>
            </td>
          </tr>
          <!-- Footer info -->
          <tr>
            <td style="padding: 0 40px 30px 40px; background-color: #ffffff;">
              <p style="margin: 0 0 12px 0; color: #666666; font-size: 14px; line-height: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">This verification link will expire in 24 hours.</p>
              <p style="margin: 0; color: #666666; font-size: 14px; line-height: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">If you didn't request this verification email, please ignore it.</p>
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

    if (!emailResult.success) {
      console.error('Error sending verification email:', emailResult.error);
      return NextResponse.json({ 
        error: "Failed to send verification email. Please try again later." 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Verification email sent. Please check your inbox." 
    });

  } catch (error) {
    console.error('Error in resend verification:', error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}

