import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { email, otp, password } = await request.json();

    if (!email || !otp || !password) {
      return NextResponse.json({ 
        error: "Email, OTP, and password are required" 
      }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ 
        error: "Password must be at least 6 characters long" 
      }, { status: 400 });
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json({ 
        error: "Invalid email address" 
      }, { status: 400 });
    }

    // Find the reset token with OTP
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: { 
        userId: user.id,
        otp,
        otpExpires: {
          gt: new Date() // OTP must not be expired
        }
      },
      include: { user: true }
    });

    if (!resetToken) {
      // Check if OTP exists but expired
      const expiredToken = await prisma.passwordResetToken.findFirst({
        where: { 
          userId: user.id,
          otp
        }
      });
      
      if (expiredToken) {
        // Clean up expired token
        await prisma.passwordResetToken.delete({
          where: { id: expiredToken.id }
        });
        return NextResponse.json({ 
          error: "OTP has expired. Please request a new password reset code." 
        }, { status: 400 });
      }
      
      return NextResponse.json({ 
        error: "Invalid OTP. Please check the code and try again." 
      }, { status: 400 });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword }
    });

    // Delete the used reset token
    await prisma.passwordResetToken.delete({
      where: { id: resetToken.id }
    });

    // Clean up any other expired tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: {
        userId: resetToken.userId,
        OR: [
          { otpExpires: { lt: new Date() } },
          { expires: { lt: new Date() } }
        ]
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Password has been reset successfully. You can now log in with your new password." 
    });

  } catch (error) {
    console.error('Error in reset password:', error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}
