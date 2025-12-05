import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { emailVerified: true, verificationToken: true }
    });

    if (!user) {
      return NextResponse.json({ 
        verified: false,
        exists: false
      });
    }

    return NextResponse.json({ 
      verified: !!user.emailVerified,
      exists: true,
      hasToken: !!user.verificationToken
    });

  } catch (error) {
    console.error('Error checking verification:', error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}

