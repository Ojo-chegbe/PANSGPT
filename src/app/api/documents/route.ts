import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getClient } from "@/lib/db";
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

    // Get user's level if logged in
    let userLevel: string | null = null;
    if (session?.user?.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { level: true }
      });
      userLevel = user?.level || null;
    }

    // Get possible level formats to match
    const possibleLevels = userLevel ? normalizeLevelForMatching(userLevel) : [];

    // Fetch from Prisma (Neon) for complete data including IDs
    const documents = await prisma.document.findMany({
      where: userLevel ? {
        // Filter by user's level if available
        OR: [
          { level: null },
          { level: '' },
          { level: { in: possibleLevels } }
        ]
      } : undefined,
      select: {
        id: true,
        title: true,
        fileName: true,
        courseCode: true,
        courseTitle: true,
        professorName: true,
        topic: true,
        level: true,
        createdAt: true,
        documentType: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ documents });
  } catch (err) {
    console.error("Failed to fetch documents:", err);
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { document_id } = await req.json();
    if (!document_id) {
      return NextResponse.json({ error: "Missing document_id" }, { status: 400 });
    }

    const client = await getClient();

    // Get collections
    const documentsCollection = client.collection('documents');
    const chunksCollection = client.collection('document_chunks');

    // Delete from Neon database (PostgreSQL) first
    try {
      // First, delete related DocumentAccess records to satisfy foreign key constraint
      await prisma.documentAccess.deleteMany({
        where: { documentId: document_id }
      });
      console.log(`DocumentAccess records for ${document_id} deleted from Neon database`);

      // Now delete the document
      await prisma.document.delete({
        where: { id: document_id }
      });
      console.log(`Document ${document_id} deleted from Neon database`);
    } catch (prismaError) {
      console.warn(`Document ${document_id} not found in Neon database:`, prismaError);
      // Continue with Astra DB deletion even if not found in Neon
    }

    // Delete from Astra DB (vector database)
    await documentsCollection.deleteOne({ _id: document_id });
    console.log(`Document ${document_id} deleted from Astra DB`);

    // Delete all associated chunks from Astra DB
    await chunksCollection.deleteMany({ document_id: document_id });
    console.log(`Chunks for document ${document_id} deleted from Astra DB`);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to delete document:", err);
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}

// Add this endpoint to get all unique topics
export async function GET_TOPICS() {
  try {
    const client = await getClient();
    const documentsCollection = client.collection('documents');
    const docs = await documentsCollection.find({}).toArray();
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