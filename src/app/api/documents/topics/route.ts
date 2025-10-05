import { NextResponse } from "next/server";
import { getClient } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    const { searchParams } = new URL(request.url);
    const courseCode = searchParams.get('courseCode');
    
    const client = await getClient();
    const documentsCollection = client.collection('documents');
    
    // Build filter based on courseCode and user level
    const filter: any = {
      level: user.level  // Filter by user's level
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