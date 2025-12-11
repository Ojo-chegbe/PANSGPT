import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/email-service";
import { isOTPExpired } from "@/lib/otp-utils";

export async function POST(request: Request) {
  try {
    const { email, otp } = await request.json();

    console.log('Verification request received, email:', email ? email : 'MISSING', 'otp:', otp ? '***' : 'MISSING');

    if (!email || !otp) {
      console.error('Email or OTP missing in verification request');
      return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 });
    }

    // Find pending signup with this email and OTP
    const pendingSignup = await prisma.pendingSignup.findFirst({
      where: {
        email,
        otp,
        otpExpires: {
          gt: new Date() // OTP must not be expired
        }
      }
    });

    if (!pendingSignup) {
      console.error('Pending signup not found for email/OTP:', email);
      // Check if OTP exists but expired
      const expiredSignup = await prisma.pendingSignup.findFirst({
        where: {
          email,
          otp,
        }
      });
      if (expiredSignup) {
        console.error('OTP found but expired. Expires:', expiredSignup.otpExpires);
        return NextResponse.json({ 
          error: "OTP has expired. Please request a new verification code." 
        }, { status: 400 });
      }
      return NextResponse.json({ 
        error: "Invalid OTP. Please check the code and try again." 
      }, { status: 400 });
    }

    console.log('Pending signup found:', {
      email: pendingSignup.email,
      name: pendingSignup.name,
      expires: pendingSignup.verificationTokenExpires
    });

    // Check if user already exists (shouldn't happen, but safety check)
    const existingUser = await prisma.user.findUnique({
      where: { email: pendingSignup.email }
    });

    if (existingUser) {
      // User already exists, delete pending signup and return error
      await prisma.pendingSignup.delete({
        where: { id: pendingSignup.id }
      });
      return NextResponse.json({ 
        error: "This email is already registered. Please log in instead." 
      }, { status: 400 });
    }

    // Create the actual user account
    console.log('Creating user account for:', pendingSignup.email);
    const user = await prisma.user.create({
      data: {
        email: pendingSignup.email,
        password: pendingSignup.password,
        name: pendingSignup.name,
        level: pendingSignup.level,
        emailVerified: new Date(), // Mark as verified immediately
        verificationToken: null,
        verificationTokenExpires: null
      }
    });

    // Clear OTP after successful verification
    await prisma.pendingSignup.update({
      where: { id: pendingSignup.id },
      data: {
        otp: null,
        otpExpires: null
      }
    });

    console.log('User created successfully:', {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerified
    });

    // Delete the pending signup record
    await prisma.pendingSignup.delete({
      where: { id: pendingSignup.id }
    });
    console.log('Pending signup record deleted');

    // Send welcome email from The Founders after successful verification
    try {
      const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      await sendWelcomeEmail(user.name || 'there', user.email, `${appUrl}/login`);
      console.log('Welcome email sent to:', user.email);
    } catch (welcomeEmailError: any) {
      // Log error but don't fail the verification
      console.error('Error sending welcome email after verification:', welcomeEmailError);
    }

    return NextResponse.json({ 
      success: true, 
      message: "Email verified successfully. You can now log in.",
      email: user.email
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error in verify email:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    return NextResponse.json({ 
      error: error.message || "Internal server error" 
    }, { status: 500 });
  }
}

