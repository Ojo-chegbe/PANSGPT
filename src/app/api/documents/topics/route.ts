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

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const courseCode = searchParams.get('courseCode');

    const client = await getClient();
    const documentsCollection = client.collection('documents');

    // Build filter based on courseCode and user level (with normalized matching)
    const filter: any = {
      level: { $in: possibleLevels }  // Filter by any matching level format
    };
    if (courseCode) {
      filter.course_code = courseCode;
    }

    const docs = await documentsCollection.find(filter).toArray();

    // Get unique, non-empty topics
    const topicsSet = new Set<string>();
    docs.forEach(doc => {
      if (doc.topic && typeof doc.topic === 'string' && doc.topic.trim()) {
        topicsSet.add(doc.topic.trim());
      }
    });

    return NextResponse.json({ topics: Array.from(topicsSet) });
  } catch (err) {
    console.error("Failed to fetch topics:", err);
    return NextResponse.json({ error: "Failed to fetch topics" }, { status: 500 });
  }
} 