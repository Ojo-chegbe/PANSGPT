import { NextResponse } from "next/server";
import { getClient } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Helper function to normalize level format for matching
function normalizeLevelForMatching(level: string): string[] {
  // Extract the numeric part (e.g., "400" from "400 Level" or just "400")
  const match = level.match(/(\d+)/);
  if (!match) return [level];

  const numericLevel = match[1];
  // Return possible formats to match against
  return [
    level,                           // Original format (e.g., "400 Level")
    numericLevel,                   // Just the number (e.g., "400")
    `${numericLevel} Level`,       // With " Level" suffix
    `${numericLevel}L`,            // With "L" suffix
  ];
}

export async function GET() {
  try {
    // Get user session to filter by level
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's level
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { level: true }
    });

    if (!user?.level) {
      return NextResponse.json({ error: "User level not found" }, { status: 404 });
    }

    // Get possible level formats to match
    const possibleLevels = normalizeLevelForMatching(user.level);

    const client = await getClient();
    const documentsCollection = await client.createCollection('documents');

    // Filter documents by any matching level format
    const docs = await documentsCollection.find({
      level: { $in: possibleLevels }
    }).toArray();

    // Get unique courses for the user's level
    const courseMap = new Map();
    docs.forEach(doc => {
      if (doc.course_code && doc.course_title && doc.level) {
        const key = `${doc.course_code}|${doc.course_title}|${doc.level}`;
        if (!courseMap.has(key)) {
          courseMap.set(key, {
            courseCode: doc.course_code,
            courseTitle: doc.course_title,
            level: doc.level
          });
        }
      }
    });

    return NextResponse.json({ courses: Array.from(courseMap.values()) });
  } catch (err) {
    console.error("Failed to fetch courses:", err);
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
  }
} 