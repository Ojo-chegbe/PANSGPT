import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, EMAIL_ADDRESSES } from "@/lib/email-service";
import { generateOTP, getOTPExpiration } from "@/lib/otp-utils";
import crypto from "crypto";

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
        message: "If an account with that email exists, a password reset code has been sent." 
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpires = getOTPExpiration();

    // Delete any existing reset tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id }
    });

    // Store OTP in database
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        otp,
        otpExpires
      }
    });

    // Send reset email with OTP
    try {
      const plainText = `Password Reset Request

Hi ${user.name || 'there'},

We received a request to reset your password for your PansGPT account. Use the OTP (One-Time Password) below to reset your password:

Your reset code: ${otp}

This code will expire in 10 minutes.

Enter this code on the password reset page to set a new password.

If you didn't request this password reset, please ignore this email. Your password will remain unchanged.

Best regards,
The PansGPT Team`;

      const emailResult = await sendEmail({
        from: EMAIL_ADDRESSES.NO_REPLY,
        to: user.email,
        subject: 'Reset your PansGPT password - OTP Code',
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
              <p style="margin: 0 0 24px 0; color: #333333; font-size: 16px; line-height: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">We received a request to reset your password for your PansGPT account. Use the OTP (One-Time Password) below to reset your password:</p>
            </td>
          </tr>
          <!-- OTP Code -->
          <tr>
            <td style="padding: 0 40px 30px 40px; text-align: center; background-color: #ffffff;">
              <div style="background-color: #f0fdf4; border: 2px solid #10b981; border-radius: 8px; padding: 24px; margin: 0 auto; display: inline-block;">
                <p style="margin: 0 0 8px 0; color: #166534; font-size: 14px; font-weight: 600; line-height: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Your Reset Code</p>
                <p style="margin: 0; color: #10b981; font-size: 36px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', Courier, monospace; line-height: 1.2;">${otp}</p>
              </div>
            </td>
          </tr>
          <!-- Instructions -->
          <tr>
            <td style="padding: 0 40px 30px 40px; background-color: #ffffff;">
              <p style="margin: 0 0 12px 0; color: #666666; font-size: 14px; line-height: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Enter this code on the password reset page to set a new password.</p>
              <p style="margin: 0 0 12px 0; color: #666666; font-size: 14px; line-height: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">This code will expire in 10 minutes.</p>
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

      if (!emailResult.success) {
        console.error('Error sending reset email:', emailResult.error);
        return NextResponse.json({ 
          error: "Failed to send reset email. Please try again later." 
        }, { status: 500 });
      }

      console.log('Password reset email sent successfully:', emailResult.messageId || 'sent', 'to:', user.email);
    } catch (emailSendError: any) {
      console.error('Exception sending reset email:', emailSendError);
      return NextResponse.json({ 
        error: "Failed to send reset email. Please try again later." 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "If an account with that email exists, a password reset code has been sent." 
    });

  } catch (error) {
    console.error('Error in forgot password:', error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}
