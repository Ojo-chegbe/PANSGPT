import { NextResponse } from "next/server";
import { getClient } from "@/lib/db";
import { generateQueryVariations } from "@/lib/quiz-diversity";
import { generateEmbeddings } from "@/lib/embedding-service";

const ASTRA_DB_COLLECTION = process.env.ASTRA_DB_COLLECTION || 'document_chunks';

// Query expansion function to generate diverse search queries
function expandQuery(baseQuery: string, topic?: string, courseCode?: string): string[] {
  return generateQueryVariations(baseQuery, topic, courseCode);
}

// MMR (Maximal Marginal Relevance) function for diversity
function mmrDiversify(results: any[], queryEmbedding: number[], lambda: number = 0.5, maxResults: number = 10): any[] {
  if (results.length <= maxResults) return results;
  
  const selected: any[] = [];
  const remaining = [...results];
  
  // Start with the most relevant result
  if (remaining.length > 0) {
    selected.push(remaining.shift());
  }
  
  while (selected.length < maxResults && remaining.length > 0) {
    let bestScore = -1;
    let bestIndex = -1;
    
    for (let i = 0; i < remaining.length; i++) {
      const relevance = remaining[i].$similarity || 0;
      const diversity = Math.min(...selected.map(s => 
        1 - cosineSimilarity(remaining[i].embedding || [], s.embedding || [])
      ));
      const score = lambda * relevance + (1 - lambda) * diversity;
      
      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    }
    
    if (bestIndex >= 0) {
      selected.push(remaining.splice(bestIndex, 1)[0]);
    } else {
      break;
    }
  }
  
  return selected;
}

// Cosine similarity function
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function POST(request: Request) {
  try {
    const { query, filters = {} } = await request.json();

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const client = await getClient();
    const collection = client.collection(ASTRA_DB_COLLECTION);

    // Build filter conditions - handle both metadata structures
    const filterConditions: any = {};
    
    // Don't apply strict filters initially - let the search find relevant content
    // and then filter in memory to handle different metadata structures
    console.log('Using broad search without strict filters to find more content');
    
    // Debug: Check what's actually in the database
    const totalDocs = await collection.find({}).toArray();
    console.log(`Total documents in database: ${totalDocs.length}`);
    
    if (totalDocs.length > 0) {
      const sampleDoc = totalDocs[0];
      console.log('Sample document structure:', {
        id: sampleDoc._id,
        hasMetadata: !!sampleDoc.metadata,
        metadataKeys: sampleDoc.metadata ? Object.keys(sampleDoc.metadata) : [],
        hasEmbedding: !!sampleDoc.$vector,
        embeddingLength: sampleDoc.$vector?.length,
        chunkTextLength: sampleDoc.chunk_text?.length,
        courseCode: sampleDoc.metadata?.courseCode,
        contextCourseCode: sampleDoc.metadata?.context?.course_info?.code,
        topic: sampleDoc.metadata?.topic,
        contextTopic: sampleDoc.metadata?.context?.topic_area,
        level: sampleDoc.metadata?.level,
        contextLevel: sampleDoc.metadata?.context?.level
      });
    }

    console.log('Diverse quiz search filter conditions:', filterConditions);

    let allResults: any[] = [];
    let expandedQueries: string[] = [query]; // Initialize with base query

    // Try vector search first if embedding service is available
    try {
      console.log('Getting embeddings from Qwen API for diverse quiz search...');
      
      // Generate diverse queries for better coverage
      expandedQueries = expandQuery(query, filters.topic, filters.courseCode);
      console.log('Expanded queries for quiz search:', expandedQueries);
      
      // Get embeddings for all expanded queries using Qwen API
      console.log(`Requesting embeddings for ${expandedQueries.length} queries`);
      const embeddings = await generateEmbeddings(expandedQueries);
      console.log('Got embedding response for quiz search:', { 
        hasEmbeddings: !!embeddings,
        embeddingCount: embeddings?.length,
        embeddingSize: embeddings?.[0]?.length 
      });

      // If we didn't get enough embeddings, fallback to using just the base query
      if (!embeddings || embeddings.length < expandedQueries.length) {
        console.warn(`Only got ${embeddings?.length || 0} embeddings for ${expandedQueries.length} queries. Using base query only.`);
        const baseEmbedding = await generateEmbeddings([query]);
        expandedQueries = [query];
        embeddings.splice(0, embeddings.length, ...baseEmbedding);
      }

      // Search with each expanded query
      for (let i = 0; i < embeddings.length; i++) {
        const queryEmbedding = embeddings[i];
        const currentQuery = expandedQueries[i];
        
        console.log(`Diverse search with query ${i + 1}: "${currentQuery}"`);
        
        // Do broad vector search first to get more results - cast a much wider net
        let queryResults = await collection.find(
          {},
          {
            sort: {
              $vector: queryEmbedding
            },
            limit: Math.max(200, (filters.max_chunks || 20) * 10), // Get many more results for better filtering
            includeSimilarity: true
          }
        ).toArray();

        // Filter results in memory based on course, topic, and level
        if (filters.courseCode || filters.topic || filters.level) {
          console.log(`Before filtering: ${queryResults.length} results`);
          console.log(`Filter conditions: courseCode=${filters.courseCode}, topic=${filters.topic}, level=${filters.level}`);
          
          queryResults = queryResults.filter(chunk => {
            const metadata = chunk.metadata || {};
            
            // Check course code (handle both metadata structures)
            const courseCodeMatch = !filters.courseCode || 
              metadata.courseCode === filters.courseCode ||
              metadata.context?.course_info?.code === filters.courseCode;
            
            // Check topic
            const topicMatch = !filters.topic || 
              metadata.topic === filters.topic?.trim() ||
              metadata.context?.topic_area === filters.topic?.trim();
            
            // Check level
            const levelMatch = !filters.level || 
              metadata.level === filters.level ||
              metadata.context?.level === filters.level;
            
            const matches = courseCodeMatch && topicMatch && levelMatch;
            
            if (!matches && i === 0) { // Log first query for debugging
              console.log(`Chunk filtered out: courseCode=${metadata.courseCode}, topic=${metadata.topic}, level=${metadata.level}`);
            }
            
            return matches;
          });
          
          console.log(`After filtering: ${queryResults.length} results`);
        }

        // Cast a wider net - get 20 chunks per query (2 queries = 40 total chunks)
        const resultsPerQuery = 20;
        queryResults = queryResults.slice(0, resultsPerQuery);

        allResults.push(...queryResults);
        console.log(`Query ${i + 1} found ${queryResults.length} results`);
      }

      // Remove duplicates based on chunk_text
      const uniqueResults = allResults.filter((result, index, self) => 
        index === self.findIndex(r => r.chunk_text === result.chunk_text)
      );

      console.log(`Total unique results after deduplication: ${uniqueResults.length}`);
      console.log(`Total raw results collected: ${allResults.length} (from 2 queries)`);

      // If we don't have enough results, try a broader search without filters
      if (uniqueResults.length < 10) {
        console.log('Not enough results with filters, trying broader search...');
        
        // Try a broader search with just the first query - cast an even wider net
        const broadResults = await collection.find(
          {},
          {
            sort: {
              $vector: embeddings[0]
            },
            limit: 100, // Get even more results for broader search
            includeSimilarity: true
          }
        ).toArray();
        
        console.log(`Broad search found ${broadResults.length} results`);
        
        // Add broad results to our collection
        allResults.push(...broadResults);
        
        // Re-deduplicate
        const newUniqueResults = allResults.filter((result, index, self) => 
          index === self.findIndex(r => r.chunk_text === result.chunk_text)
        );
        
        console.log(`After broad search: ${newUniqueResults.length} total unique results`);
        
        // Use the broader results if we have more
        if (newUniqueResults.length > uniqueResults.length) {
          uniqueResults.splice(0, uniqueResults.length, ...newUniqueResults);
        }
      }

      // Apply MMR diversification on the entire pool for true diversity
      if (uniqueResults.length > 0) {
        const targetChunks = filters.max_chunks || 20;
        console.log(`Applying MMR diversification to ${uniqueResults.length} unique results (from 2 queries), targeting ${targetChunks} diverse chunks`);
        
        const diversifiedResults = mmrDiversify(
          uniqueResults, 
          embeddings[0], // Use first query embedding for MMR
          filters.diversity_lambda || 0.7, // Higher diversity for better source variety
          targetChunks
        );
        
        allResults = diversifiedResults;
        console.log(`After MMR diversification: ${allResults.length} diverse chunks selected from ${uniqueResults.length} total candidates`);
      }

    } catch (embeddingError) {
      console.error('Embedding service failed for quiz search:', embeddingError);
      
      // Fallback to text search
      console.log('Falling back to text search for quiz...');
      
      // Get all documents and filter in memory (Astra DB doesn't support $regex)
      const allDocs = await collection.find({}).toArray();
      console.log(`Found ${allDocs.length} total chunks in database for text search fallback`);
      
      // Generate expanded queries for better coverage
      expandedQueries = expandQuery(query, filters.topic, filters.courseCode);
      
      for (const expandedQuery of expandedQueries) {
        const textSearchResults = allDocs.filter(doc => {
          const metadata = doc.metadata || {};
          
          // Check course, topic, and level filters (handle both metadata structures)
          const courseCodeMatch = !filters.courseCode || 
            metadata.courseCode === filters.courseCode ||
            metadata.context?.course_info?.code === filters.courseCode;
          
          const topicMatch = !filters.topic || 
            metadata.topic === filters.topic?.trim() ||
            metadata.context?.topic_area === filters.topic?.trim();
          
          const levelMatch = !filters.level || 
            metadata.level === filters.level ||
            metadata.context?.level === filters.level;
          
          // Check if text contains the query
          const matchesText = doc.chunk_text?.toLowerCase().includes(expandedQuery.toLowerCase());
          
          return matchesText && courseCodeMatch && topicMatch && levelMatch;
        });
        
        if (textSearchResults.length > 0) {
          console.log(`Text search fallback found ${textSearchResults.length} results for query "${expandedQuery}"`);
          allResults.push(...textSearchResults.slice(0, Math.ceil((filters.max_chunks || 10) / expandedQueries.length)));
        }
      }
      
      // Remove duplicates based on chunk_text
      allResults = allResults.filter((result, index, self) => 
        index === self.findIndex(r => r.chunk_text === result.chunk_text)
      );
      
      console.log(`Text search found ${allResults.length} total results`);
    }

    // Process results for quiz generation
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
      chunks: processedResults, // Keep 'chunks' for backward compatibility
      results: processedResults,
      totalResults: processedResults.length,
      searchType: 'diverse_quiz_search',
      expandedQueries: expandedQueries || [query]
    });

  } catch (error) {
    console.error('Diverse quiz search error:', error);
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
