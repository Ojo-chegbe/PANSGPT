/**
 * Document Indexing Service
 * 
 * This service handles the asynchronous indexing of documents to pre-compute
 * embeddings and store them in the database for fast retrieval.
 */

import { getClient } from './db';
import { generateEmbeddings } from './embedding-service';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

export interface DocumentIndexingJob {
  documentId: string;
  fileName: string;
  content: string;
  metadata: {
    courseCode: string;
    courseTitle: string;
    professorName: string;
    topic: string;
    level: string;
  };
}

export interface IndexingResult {
  success: boolean;
  documentId: string;
  chunksCreated: number;
  error?: string;
}

/**
 * Index a document by chunking it and generating embeddings
 */
export async function indexDocument(job: DocumentIndexingJob): Promise<IndexingResult> {
  try {
    console.log(`Starting indexing for document: ${job.documentId}`);
    
    const client = await getClient();
    const chunksCollection = client.collection('document_chunks');
    
    // Delete existing chunks for this document
    try {
      await chunksCollection.deleteMany({ document_id: job.documentId });
      console.log(`Deleted existing chunks for document ${job.documentId}`);
    } catch (error) {
      console.log('No existing chunks to delete');
    }
    
    // Split document into chunks
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    
    const chunks = await splitter.createDocuments([job.content]);
    console.log(`Created ${chunks.length} chunks for document ${job.documentId}`);
    
    // Generate embeddings for all chunks
    const chunkTexts = chunks.map(chunk => chunk.pageContent);
    console.log(`Generating embeddings for ${chunkTexts.length} chunks...`);
    
    const embeddings = await generateEmbeddings(chunkTexts);
    console.log(`Generated ${embeddings.length} embeddings`);
    
    // Prepare documents for database insertion
    const documents = chunks.map((chunk, index) => ({
      _id: `${job.documentId}_chunk_${index}`,
      document_id: job.documentId,
      chunk_index: index,
      chunk_text: chunk.pageContent,
      $vector: embeddings[index],
      created_at: new Date().toISOString(),
      metadata: {
        ...job.metadata,
        author: job.metadata.professorName,
        source: `${job.metadata.professorName}'s notes`,
        fullSource: `${job.metadata.professorName}'s notes on ${job.metadata.topic} (${job.metadata.courseCode})`,
        level: job.metadata.level || ''
      }
    }));
    
    // Insert chunks into database
    await chunksCollection.insertMany(documents);
    console.log(`Successfully indexed document ${job.documentId} with ${documents.length} chunks`);
    
    return {
      success: true,
      documentId: job.documentId,
      chunksCreated: documents.length
    };
    
  } catch (error) {
    console.error(`Error indexing document ${job.documentId}:`, error);
    return {
      success: false,
      documentId: job.documentId,
      chunksCreated: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Re-index all documents in the database
 */
export async function reindexAllDocuments(): Promise<IndexingResult[]> {
  try {
    console.log('Starting re-indexing of all documents...');
    
    const client = await getClient();
    const documentsCollection = client.collection('documents');
    const chunksCollection = client.collection('document_chunks');
    
    // Get all documents
    const documents = await documentsCollection.find({}).toArray();
    console.log(`Found ${documents.length} documents to re-index`);
    
    const results: IndexingResult[] = [];
    
    for (const doc of documents) {
      const job: DocumentIndexingJob = {
        documentId: doc._id,
        fileName: doc.file_name || doc.title,
        content: doc.content || '',
        metadata: {
          courseCode: doc.course_code || '',
          courseTitle: doc.course_title || '',
          professorName: doc.professor_name || '',
          topic: doc.topic || '',
          level: doc.level || ''
        }
      };
      
      const result = await indexDocument(job);
      results.push(result);
      
      // Add delay between documents to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('Re-indexing completed');
    return results;
    
  } catch (error) {
    console.error('Error during re-indexing:', error);
    return [{
      success: false,
      documentId: 'all',
      chunksCreated: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }];
  }
}

/**
 * Check if a document is properly indexed
 */
export async function isDocumentIndexed(documentId: string): Promise<boolean> {
  try {
    const client = await getClient();
    const chunksCollection = client.collection('document_chunks');
    
    const chunks = await chunksCollection.find({ 
      document_id: documentId,
      $vector: { $exists: true }
    }).toArray();
    
    return chunks.length > 0;
  } catch (error) {
    console.error(`Error checking if document ${documentId} is indexed:`, error);
    return false;
  }
}

/**
 * Get indexing statistics
 */
export async function getIndexingStats(): Promise<{
  totalDocuments: number;
  indexedDocuments: number;
  totalChunks: number;
  chunksWithEmbeddings: number;
}> {
  try {
    const client = await getClient();
    const documentsCollection = client.collection('documents');
    const chunksCollection = client.collection('document_chunks');
    
    const [totalDocuments, totalChunks, chunksWithEmbeddings] = await Promise.all([
      documentsCollection.countDocuments({}),
      chunksCollection.countDocuments({}),
      chunksCollection.countDocuments({ $vector: { $exists: true } })
    ]);
    
    // Get list of all document IDs
    const documents = await documentsCollection.find({}, { projection: { _id: 1 } }).toArray();
    const documentIds = documents.map(doc => doc._id);
    
    // Count how many documents have at least one chunk with embedding
    let indexedDocuments = 0;
    for (const docId of documentIds) {
      const hasEmbeddings = await isDocumentIndexed(docId);
      if (hasEmbeddings) indexedDocuments++;
    }
    
    return {
      totalDocuments,
      indexedDocuments,
      totalChunks,
      chunksWithEmbeddings
    };
  } catch (error) {
    console.error('Error getting indexing stats:', error);
    return {
      totalDocuments: 0,
      indexedDocuments: 0,
      totalChunks: 0,
      chunksWithEmbeddings: 0
    };
  }
}
