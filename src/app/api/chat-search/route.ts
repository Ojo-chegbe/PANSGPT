import { NextResponse } from "next/server";
import { getClient } from "@/lib/db";
import { generateEmbeddings } from "@/lib/embedding-service";

const ASTRA_DB_COLLECTION = process.env.ASTRA_DB_COLLECTION || 'document_chunks';

export async function POST(request: Request) {
  try {
    const { query, filters = {} } = await request.json();

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const client = await getClient();
    const collection = client.collection(ASTRA_DB_COLLECTION);

    // Build filter conditions for course documents (level-based)
    // General knowledge documents will be searched separately
    const courseFilterConditions: any = {};
    const generalFilterConditions: any = {};
    
    // Course documents: apply level filter and other filters
    if (filters.level) {
      // For course documents: must match level AND be course type (or missing documentType for backward compatibility)
      courseFilterConditions["metadata.level"] = filters.level;
    }
    
    // General knowledge documents: accessible to all, no level filter
    generalFilterConditions["metadata.documentType"] = "general";
    
    // Apply other filters to both types
    if (filters.courseCode) {
      courseFilterConditions["metadata.courseCode"] = filters.courseCode;
      generalFilterConditions["metadata.courseCode"] = filters.courseCode;
    }
    
    if (filters.topic) {
      courseFilterConditions["metadata.topic"] = filters.topic.trim();
      generalFilterConditions["metadata.topic"] = filters.topic.trim();
    }
    
    if (filters.author) {
      courseFilterConditions["metadata.professorName"] = { $in: [
        filters.author,
        `Prof. ${filters.author}`,
        `Professor ${filters.author}`,
        `Dr. ${filters.author}`
      ]};
      generalFilterConditions["metadata.professorName"] = { $in: [
        filters.author,
        `Prof. ${filters.author}`,
        `Professor ${filters.author}`,
        `Dr. ${filters.author}`
      ]};
    }

    console.log('Fast chat search filter conditions:', {
      course: courseFilterConditions,
      general: generalFilterConditions
    });

    let allResults: any[] = [];

    // Try vector search first if embedding service is available
    try {
      console.log('Getting embeddings from Qwen API for chat search...');
      
      // Simple query - no expansion for speed
      const embeddings = await generateEmbeddings([query]);
      console.log('Got embedding response for chat search:', { 
        hasEmbeddings: !!embeddings,
        embeddingSize: embeddings?.[0]?.length 
      });

      // Single vector search for speed
      const queryEmbedding = embeddings[0];
      
      console.log(`Fast search with query: "${query}"`);
      
      // Perform two searches: one for course documents, one for general knowledge
      const maxChunks = filters.max_chunks || 5;
      const chunksPerType = Math.ceil(maxChunks / 2); // Split between course and general
      
      // Search for course documents (level-filtered)
      let courseResults: any[] = [];
      if (filters.level) {
        try {
          courseResults = await collection.find(
            courseFilterConditions,
            {
              sort: {
                $vector: queryEmbedding
              },
              limit: chunksPerType,
              includeSimilarity: true
            }
          ).toArray();
          console.log(`Found ${courseResults.length} course document results`);
        } catch (error) {
          console.error('Error searching course documents:', error);
        }
      }
      
      // Search for general knowledge documents (accessible to all)
      let generalResults: any[] = [];
      try {
        generalResults = await collection.find(
          generalFilterConditions,
          {
            sort: {
              $vector: queryEmbedding
            },
            limit: chunksPerType,
            includeSimilarity: true
          }
        ).toArray();
        console.log(`Found ${generalResults.length} general knowledge results`);
      } catch (error) {
        console.error('Error searching general knowledge documents:', error);
      }
      
      // Combine results and sort by similarity
      allResults = [...courseResults, ...generalResults];
      
      // Remove duplicates based on chunk_text
      const seen = new Set<string>();
      allResults = allResults.filter(chunk => {
        const text = chunk.chunk_text;
        if (seen.has(text)) return false;
        seen.add(text);
        return true;
      });
      
      // Sort by similarity score
      allResults.sort((a, b) => (b.$similarity || 0) - (a.$similarity || 0));
      
      // Limit to max_chunks
      allResults = allResults.slice(0, maxChunks);
      
      console.log(`Fast search found ${allResults.length} total results (${courseResults.length} course + ${generalResults.length} general)`);

    } catch (embeddingError) {
      console.error('Embedding service failed for chat search:', embeddingError);
      console.log('Falling back to text-based search...');
      
      // Fallback to text search
      console.log('Falling back to text search for chat...');
      
      // Get all documents and filter in memory (Astra DB doesn't support $regex)
      const allDocs = await collection.find({}).toArray();
      
      const textSearchResults = allDocs.filter(doc => {
        const metadata = doc.metadata || {};
        const docType = metadata.documentType || 'course'; // Default to 'course' for backward compatibility
        
        // Check if it's general knowledge (accessible to all) or course document matching level
        const isGeneralKnowledge = docType === 'general';
        const isCourseMatchingLevel = docType === 'course' && 
          (!filters.level || metadata.level === filters.level);
        
        if (!isGeneralKnowledge && !isCourseMatchingLevel) {
          return false;
        }
        
        // Check other filters
        const matchesCourseCode = !filters.courseCode || metadata.courseCode === filters.courseCode;
        const matchesTopic = !filters.topic || metadata.topic === filters.topic?.trim();
        const matchesAuthor = !filters.author || 
          metadata.professorName?.toLowerCase().includes(filters.author.toLowerCase());
        
        // Check if text contains the query
        const matchesText = doc.chunk_text?.toLowerCase().includes(query.toLowerCase());
        
        return matchesCourseCode && matchesTopic && matchesAuthor && matchesText;
      });
      
      allResults = textSearchResults.slice(0, filters.max_chunks || 5);
      console.log(`Text search found ${allResults.length} results`);
    }

    // Process results for chat
    const processedResults = allResults.map((chunk: any) => ({
      chunk_text: chunk.chunk_text,
      metadata: {
        ...chunk.metadata,
        relevance_score: chunk.$similarity || 0,
        source: chunk.metadata?.source || 'Unknown',
        title: chunk.metadata?.title || 'Untitled',
        author: chunk.metadata?.author || 'Unknown',
        page: chunk.metadata?.page || 0,
        section: chunk.metadata?.section || 'Unknown',
        topic: chunk.metadata?.topic || 'General',
        type: chunk.metadata?.type || 'Document',
        date: chunk.metadata?.date || 'Unknown',
        context: chunk.metadata?.context || {
          section: chunk.metadata?.section || 'Unknown',
          topic_area: chunk.metadata?.topic || 'General',
          document_type: chunk.metadata?.type || 'Document',
          course_info: {
            code: chunk.metadata?.course_info?.code || filters.courseCode || 'Unknown',
            title: chunk.metadata?.course_info?.title || 'Unknown'
          },
          date: chunk.metadata?.date || 'Unknown',
          related_concepts: chunk.metadata?.related_concepts || []
        }
      }
    }));

    // Sort by relevance score
    processedResults.sort((a: any, b: any) => (b.metadata.relevance_score || 0) - (a.metadata.relevance_score || 0));

    return NextResponse.json({
      success: true,
      query,
      results: processedResults,
      totalResults: processedResults.length,
      searchType: 'fast_chat_search'
    });

  } catch (error) {
    console.error('Fast chat search error:', error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}

// Export a GET handler that returns 501 for unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: "Method not supported. Use POST for search." },
    { status: 501 }
  );
}
