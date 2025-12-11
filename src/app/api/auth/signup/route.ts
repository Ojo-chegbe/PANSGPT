import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendEmail, EMAIL_ADDRESSES } from "@/lib/email-service";
import { generateOTP, getOTPExpiration } from "@/lib/otp-utils";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { email, password, name, level } = await request.json();
    if (!email || !password || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if user already exists (verified)
    const existingUser = await prisma.user.findUnique({ 
      where: { email },
      select: { id: true, email: true, emailVerified: true }
    });
    if (existingUser && existingUser.emailVerified) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    // Check if there's a pending signup for this email
    const existingPending = await prisma.pendingSignup.findUnique({
      where: { email },
    });
    
    if (existingPending) {
      // Generate new OTP
      const otp = generateOTP();
      const otpExpires = getOTPExpiration();

      // Update pending signup with new OTP and user info (in case they changed name/level)
      await prisma.pendingSignup.update({
        where: { email },
        data: {
          name,
          level,
          password: await bcrypt.hash(password, 10), // Update password in case they want to change it
          otp,
          otpExpires
        }
      });

      // Resend verification email with OTP
      try {
        const plainText = `Welcome to PansGPT!

Hi ${name},

Thank you for signing up for PansGPT. Please verify your email address using the OTP (One-Time Password) below:

Your verification code: ${otp}

This code will expire in 10 minutes.

Enter this code on the verification page to complete your registration.

If you didn't create an account with PansGPT, please ignore this email.

Best regards,
The PansGPT Team`;

        const emailResult = await sendEmail({
          from: EMAIL_ADDRESSES.NO_REPLY,
          to: email,
          subject: 'Verify your PansGPT account - OTP Code',
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
              <h1 style="margin: 0; color: #10b981; font-size: 28px; font-weight: 600; line-height: 1.2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Welcome to PansGPT!</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 30px 40px; background-color: #ffffff;">
              <p style="margin: 0 0 16px 0; color: #333333; font-size: 16px; line-height: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Hi ${name},</p>
              <p style="margin: 0 0 24px 0; color: #333333; font-size: 16px; line-height: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Thank you for signing up for PansGPT. Please verify your email address using the OTP (One-Time Password) below:</p>
            </td>
          </tr>
          <!-- OTP Code -->
          <tr>
            <td style="padding: 0 40px 30px 40px; text-align: center; background-color: #ffffff;">
              <div style="background-color: #f0fdf4; border: 2px solid #10b981; border-radius: 8px; padding: 24px; margin: 0 auto; display: inline-block;">
                <p style="margin: 0 0 8px 0; color: #166534; font-size: 14px; font-weight: 600; line-height: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Your Verification Code</p>
                <p style="margin: 0; color: #10b981; font-size: 36px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', Courier, monospace; line-height: 1.2;">${otp}</p>
              </div>
            </td>
          </tr>
          <!-- Instructions -->
          <tr>
            <td style="padding: 0 40px 30px 40px; background-color: #ffffff;">
              <p style="margin: 0 0 12px 0; color: #666666; font-size: 14px; line-height: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Enter this code on the verification page to complete your registration.</p>
              <p style="margin: 0 0 12px 0; color: #666666; font-size: 14px; line-height: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">This code will expire in 10 minutes.</p>
              <p style="margin: 0; color: #666666; font-size: 14px; line-height: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">If you didn't create an account with PansGPT, please ignore this email.</p>
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
          console.error('Error resending verification email:', emailResult.error);
          return NextResponse.json({ 
            error: "A verification email was already sent to this address, but we couldn't send a new one. Please check your email or try again later." 
          }, { status: 500 });
        }

        console.log('Verification email resent successfully:', emailResult.messageId || 'sent');
        
        return NextResponse.json({ 
          success: true, 
          message: "A verification email has already been sent to this address. We've sent you a new verification email. Please check your inbox to verify your account." 
        });
      } catch (emailSendError: any) {
        console.error('Exception resending verification email:', emailSendError);
        return NextResponse.json({ 
          error: "A verification email was already sent to this address, but we couldn't send a new one. Please check your email or try again later." 
        }, { status: 500 });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generate OTP
    const otp = generateOTP();
    const otpExpires = getOTPExpiration();

    // Store in pending signup table instead of creating user
    const pendingSignup = await prisma.pendingSignup.create({
      data: { 
        email, 
        password: hashedPassword, 
        name, 
        level,
        otp,
        otpExpires
      }
    });

    // Send verification email with OTP
    try {
      const plainText = `Welcome to PansGPT!

Hi ${name},

Thank you for signing up for PansGPT. Please verify your email address using the OTP (One-Time Password) below:

Your verification code: ${otp}

This code will expire in 10 minutes.

Enter this code on the verification page to complete your registration.

If you didn't create an account with PansGPT, please ignore this email.

Best regards,
The PansGPT Team`;

      const emailResult = await sendEmail({
        from: EMAIL_ADDRESSES.NO_REPLY,
        to: email,
        subject: 'Verify your PansGPT account - OTP Code',
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
              <h1 style="margin: 0; color: #10b981; font-size: 28px; font-weight: 600; line-height: 1.2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Welcome to PansGPT!</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 30px 40px; background-color: #ffffff;">
              <p style="margin: 0 0 16px 0; color: #333333; font-size: 16px; line-height: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Hi ${name},</p>
              <p style="margin: 0 0 24px 0; color: #333333; font-size: 16px; line-height: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Thank you for signing up for PansGPT. Please verify your email address using the OTP (One-Time Password) below:</p>
            </td>
          </tr>
          <!-- OTP Code -->
          <tr>
            <td style="padding: 0 40px 30px 40px; text-align: center; background-color: #ffffff;">
              <div style="background-color: #f0fdf4; border: 2px solid #10b981; border-radius: 8px; padding: 24px; margin: 0 auto; display: inline-block;">
                <p style="margin: 0 0 8px 0; color: #166534; font-size: 14px; font-weight: 600; line-height: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Your Verification Code</p>
                <p style="margin: 0; color: #10b981; font-size: 36px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', Courier, monospace; line-height: 1.2;">${otp}</p>
              </div>
            </td>
          </tr>
          <!-- Instructions -->
          <tr>
            <td style="padding: 0 40px 30px 40px; background-color: #ffffff;">
              <p style="margin: 0 0 12px 0; color: #666666; font-size: 14px; line-height: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Enter this code on the verification page to complete your registration.</p>
              <p style="margin: 0 0 12px 0; color: #666666; font-size: 14px; line-height: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">This code will expire in 10 minutes.</p>
              <p style="margin: 0; color: #666666; font-size: 14px; line-height: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">If you didn't create an account with PansGPT, please ignore this email.</p>
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
        // Log the error but still return success (user is created)
        // In production, you might want to queue this for retry
        return NextResponse.json({ 
          success: true, 
          message: "Account created successfully, but verification email failed to send. Please contact support or try resending verification.",
          requiresVerification: true,
          warning: "Email sending failed"
        });
      }

      console.log('Verification email sent successfully:', emailResult.messageId || 'sent');
    } catch (emailSendError: any) {
      console.error('Exception sending verification email:', emailSendError);
      // User is already created, so return success with warning
      return NextResponse.json({ 
        success: true, 
        message: "Account created successfully, but verification email could not be sent. Please contact support.",
        requiresVerification: true,
        warning: "Email service error"
      });
    }

    // Log the pending signup (without sensitive data)
    console.log("Created pending signup:", { email: pendingSignup.email, name: pendingSignup.name, level: pendingSignup.level });

    return NextResponse.json({ 
      success: true, 
      message: "Account created successfully. Please check your email to verify your account before logging in.",
      requiresVerification: true
    });
  } catch (err: any) {
    console.error("Error in signup:", err);
    
    // Handle specific database errors
    if (err.code === 'P2022') {
      return NextResponse.json({ 
        error: "Database schema mismatch. Please contact support." 
      }, { status: 500 });
    }
    
    if (err.code === 'P1001') {
      return NextResponse.json({ 
        error: "Database connection failed. Please try again later." 
      }, { status: 503 });
    }
    
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
} 