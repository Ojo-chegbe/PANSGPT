import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { getClient, closeClient } from '@/lib/db';
import { DataAPIClient } from '@datastax/astra-db-ts';
import { generateEmbeddings } from '@/lib/embedding-service';
import { prisma } from '@/lib/prisma';
import { indexDocument } from '@/lib/document-indexing';

// Using Qwen3-Embedding-0.6B via embedding-service.ts

// Utility function to sanitize filenames
function sanitizeFilename(filename: string): string {
  // Remove square brackets and any other problematic characters
  return filename
    .replace(/[\[\]]/g, '')  // Remove square brackets
    .replace(/[^a-zA-Z0-9._-]/g, '_')  // Replace other special chars with underscore
    .replace(/_{2,}/g, '_');  // Replace multiple consecutive underscores with single one
}

export async function POST(request: Request) {
  let client: ReturnType<typeof DataAPIClient.prototype.db> | null = null;
  
  // Set a timeout for the entire operation
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Upload timeout')), 120000); // 2 minute timeout
  });
  
  const uploadOperation = async () => {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      client = await getClient();
    } catch (connectError: any) {
      console.error('Failed to connect to Astra DB:', connectError.message);
      return NextResponse.json(
        { error: 'Failed to connect to database. Please check your configuration.' },
        { status: 500 }
      );
    }

    // Get the form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const metadata = {
      title: formData.get('title') as string,
      courseCode: formData.get('courseCode') as string,
      courseTitle: formData.get('courseTitle') as string,
      professorName: formData.get('professorName') as string,
      topic: formData.get('topic') as string,
      uploadedBy: session.user.id,
      uploadedAt: new Date().toISOString(),
      level: formData.get('level') as string || ''
    };
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Check if it's a text file
    if (!file.name.endsWith('.txt')) {
      return NextResponse.json({ error: 'Only .txt files are supported' }, { status: 400 });
    }

    // Check if document with same filename already exists
    const originalName = file.name;
    const existingDocument = await prisma.document.findFirst({
      where: {
        fileName: originalName,
        uploadedBy: session.user.id
      }
    });

    if (existingDocument) {
      return NextResponse.json(
        { 
          error: 'A document with this filename already exists. Please rename your file or delete the existing document first.',
          existingDocumentId: existingDocument.id
        }, 
        { status: 409 } // Conflict status
      );
    }

    // Generate a unique filename
    const timestamp = Date.now();
    const uniqueFilename = `${timestamp}-${sanitizeFilename(originalName)}`;
    const documentId = `doc_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;

    // Convert File to Buffer for Supabase upload
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Get text content for processing
    const text = buffer.toString('utf-8');

    // Split text into chunks
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const chunks = await splitter.createDocuments([text]);

    // Store document metadata in Neon database using Prisma
    const document = await prisma.document.create({
      data: {
        id: documentId,
        fileName: originalName,
        title: metadata.title,
        courseCode: metadata.courseCode,
        courseTitle: metadata.courseTitle,
        professorName: metadata.professorName,
        topic: metadata.topic,
        fileUrl: uniqueFilename, // Store filename instead of Supabase path
        uploadedBy: metadata.uploadedBy,
        uploadedAt: new Date(metadata.uploadedAt),
        level: metadata.level,
        content: text // Store the text content directly
      }
    });

    console.log('Document stored in Neon database:', document.id);

    try {
      // Get collections
      const documentsCollection = await client.createCollection('documents');
      const chunksCollection = await client.createCollection('document_chunks', {
        vector: {
          dimension: 1024,  // Updated for Qwen3-Embedding-0.6B
          metric: 'cosine'
        }
      });

      // Store document metadata in Astra DB
      await documentsCollection.insertOne({
        _id: documentId,
        file_name: originalName,
        title: metadata.title,
        course_code: metadata.courseCode,
        course_title: metadata.courseTitle,
        professor_name: metadata.professorName,
        topic: metadata.topic,
        file_url: uniqueFilename, // Use filename instead of Supabase path
        uploaded_by: metadata.uploadedBy,
        uploaded_at: metadata.uploadedAt,
        level: metadata.level
      });

      // Store document chunks
      const chunkPromises = chunks.map(async (chunk, index) => {
        const chunkId = `${documentId}_chunk_${index}`;
        const chunkMetadata = {
          ...metadata,
          author: metadata.professorName,
          chunkIndex: index,
          totalChunks: chunks.length
        };

        // Generate embedding for the chunk using Qwen API
        const embeddings = await generateEmbeddings([chunk.pageContent]);
        const embedding = embeddings[0];

        return chunksCollection.insertOne({
          _id: chunkId,
          document_id: documentId,
          chunk_text: chunk.pageContent,
          $vector: embedding,
          metadata: chunkMetadata
        });
      });

      await Promise.all(chunkPromises);

    } catch (dbError) {
      console.error('Astra DB error:', dbError);
      return NextResponse.json({ error: 'Failed to store document data' }, { status: 500 });
    }

    // Start background indexing
    console.log('Starting background indexing for document:', documentId);
    indexDocument({
      documentId,
      fileName: originalName,
      content: text,
      metadata: {
        courseCode: metadata.courseCode,
        courseTitle: metadata.courseTitle,
        professorName: metadata.professorName,
        topic: metadata.topic,
        level: metadata.level || ''
      }
    }).then(result => {
      if (result.success) {
        console.log(`✅ Document ${documentId} indexed successfully with ${result.chunksCreated} chunks`);
      } else {
        console.error(`❌ Document ${documentId} indexing failed:`, result.error);
      }
    }).catch(error => {
      console.error(`❌ Document ${documentId} indexing error:`, error);
    });

    // Return success response
    return NextResponse.json({
      success: true,
      documentId,
      fileKey: uniqueFilename,
      url: uniqueFilename, // Use filename instead of Supabase path
      chunks: chunks.length,
      message: "Document uploaded successfully. Indexing in progress..."
    });
  };

  try {
    // Race between upload operation and timeout
    return await Promise.race([uploadOperation(), timeoutPromise]);
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  } finally {
    if (client) {
      await closeClient();
    }
  }
} 