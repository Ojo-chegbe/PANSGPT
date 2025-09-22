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

    // Build filter conditions
    const filterConditions: any = {};
    
    if (filters.courseCode) {
      filterConditions["metadata.course_info.code"] = filters.courseCode;
    }
    
    if (filters.topic) {
      filterConditions["metadata.topic"] = filters.topic.trim();
    }
    
    if (filters.level) {
      filterConditions["metadata.level"] = filters.level;
    }

    console.log('Fast chat search filter conditions:', filterConditions);

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
      
      // Try vector search with filters first
      let queryResults = await collection.find(
        filterConditions,
        {
          sort: {
            $vector: queryEmbedding
          },
          limit: filters.max_chunks || 5, // Fewer chunks for chat
          includeSimilarity: true
        }
      ).toArray();

      // If no results with filters, try without filters
      if (queryResults.length === 0 && Object.keys(filterConditions).length > 0) {
        console.log('No results with filters, trying without filters...');
        queryResults = await collection.find(
          {},
          {
            sort: {
              $vector: queryEmbedding
            },
            limit: filters.max_chunks || 5,
            includeSimilarity: true
          }
        ).toArray();
      }

      allResults = queryResults;
      console.log(`Fast search found ${queryResults.length} results`);

    } catch (embeddingError) {
      console.error('Embedding service failed for chat search:', embeddingError);
      
      // Fallback to text search
      console.log('Falling back to text search for chat...');
      
      // Get all documents and filter in memory (Astra DB doesn't support $regex)
      const allDocs = await collection.find({}).toArray();
      
      const textSearchResults = allDocs.filter(doc => {
        // Check if document matches filter conditions
        const matchesFilters = Object.entries(filterConditions).every(([key, value]) => {
          const keys = key.split('.');
          let current = doc;
          for (const k of keys) {
            current = current?.[k];
          }
          return current === value;
        });
        
        // Check if text contains the query
        const matchesText = doc.chunk_text?.toLowerCase().includes(query.toLowerCase());
        
        return matchesFilters && matchesText;
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
