import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { email, password, name, level } = await request.json();
    if (!email || !password || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if user already exists using the singleton prisma client
    const existingUser = await prisma.user.findUnique({ 
      where: { email },
      select: { id: true, email: true, name: true }
    });
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name, level },
      select: { id: true, email: true, name: true, level: true }
    });

    // Log the created user (without sensitive data)
    console.log("Created user (signup):", { id: user.id, email: user.email, name: user.name, level: user.level });

    return NextResponse.json({ 
      success: true, 
      user: { id: user.id, email: user.email, name: user.name, level: user.level } 
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