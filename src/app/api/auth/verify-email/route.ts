import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Verification token is required" }, { status: 400 });
    }

    // Find user with this verification token
    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token,
        verificationTokenExpires: {
          gt: new Date() // Token must not be expired
        }
      }
    });

    if (!user) {
      return NextResponse.json({ 
        error: "Invalid or expired verification token" 
      }, { status: 400 });
    }

    // Verify the email
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        verificationToken: null,
        verificationTokenExpires: null
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Email verified successfully. You can now log in." 
    });

  } catch (error) {
    console.error('Error in verify email:', error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}

