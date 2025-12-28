import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getClient } from "@/lib/db";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Get user session to filter by level
    const session = await getServerSession(authOptions);

    // Fetch from Prisma (Neon) for complete data including IDs
    const documents = await prisma.document.findMany({
      where: session?.user?.id ? {
        // Filter by user's level if available
        OR: [
          { level: null },
          { level: '' },
          ...(session.user.id ? [{
            level: (await prisma.user.findUnique({
              where: { id: session.user.id },
              select: { level: true }
            }))?.level || undefined
          }] : [])
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