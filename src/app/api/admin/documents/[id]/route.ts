import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getClient } from '@/lib/db';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const documentId = params.id;
    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    const client = await getClient();

    // Get collections
    const documentsCollection = client.collection('documents');
    const chunksCollection = client.collection('document_chunks');

    // Delete from Neon database (PostgreSQL) first
    try {
      await prisma.document.delete({
        where: { id: documentId }
      });
      console.log(`Document ${documentId} deleted from Neon database`);
    } catch (prismaError) {
      console.warn(`Document ${documentId} not found in Neon database:`, prismaError);
      // Continue with Astra DB deletion even if not found in Neon
    }

    // Delete from Astra DB (vector database)
    await documentsCollection.deleteOne({ _id: documentId });
    console.log(`Document ${documentId} deleted from Astra DB`);
    
    // Delete all associated chunks from Astra DB
    await chunksCollection.deleteMany({ document_id: documentId });
    console.log(`Chunks for document ${documentId} deleted from Astra DB`);
    
    return NextResponse.json({ 
      success: true,
      message: `Document ${documentId} deleted successfully`
    });
  } catch (err) {
    console.error("Failed to delete document:", err);
    return NextResponse.json({ 
      error: "Failed to delete document" 
    }, { status: 500 });
  }
}
