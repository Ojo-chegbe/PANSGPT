import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/email-service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    console.log('Verification request received, token:', token ? token.substring(0, 8) + '...' : 'MISSING');

    if (!token) {
      console.error('No token provided in verification request');
      return NextResponse.json({ error: "Verification token is required" }, { status: 400 });
    }

    // Find pending signup with this verification token
    const pendingSignup = await prisma.pendingSignup.findFirst({
      where: {
        verificationToken: token,
        verificationTokenExpires: {
          gt: new Date() // Token must not be expired
        }
      }
    });

    if (!pendingSignup) {
      console.error('Pending signup not found for token:', token.substring(0, 8) + '...');
      // Check if token exists but expired
      const expiredSignup = await prisma.pendingSignup.findFirst({
        where: {
          verificationToken: token,
        }
      });
      if (expiredSignup) {
        console.error('Token found but expired. Expires:', expiredSignup.verificationTokenExpires);
      }
      return NextResponse.json({ 
        error: "Invalid or expired verification token" 
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

