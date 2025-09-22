import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { reindexAllDocuments, getIndexingStats } from "@/lib/document-indexing";

export async function POST() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin (you can add admin role checking here)
    // For now, we'll allow any authenticated user to trigger reindexing

    console.log('Starting document re-indexing...');
    
    // Start re-indexing in the background
    reindexAllDocuments().then(results => {
      const successCount = results.filter(r => r.success).length;
      const totalChunks = results.reduce((sum, r) => sum + r.chunksCreated, 0);
      console.log(`Re-indexing completed: ${successCount}/${results.length} documents successful, ${totalChunks} total chunks created`);
    }).catch(error => {
      console.error('Re-indexing failed:', error);
    });

    return NextResponse.json({ 
      success: true, 
      message: "Document re-indexing started in the background. Check logs for progress." 
    });

  } catch (error) {
    console.error("Re-indexing error:", error);
    return NextResponse.json(
      { error: "Failed to start re-indexing" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stats = await getIndexingStats();
    
    return NextResponse.json({ 
      success: true, 
      stats 
    });

  } catch (error) {
    console.error("Error getting indexing stats:", error);
    return NextResponse.json(
      { error: "Failed to get indexing stats" },
      { status: 500 }
    );
  }
}
