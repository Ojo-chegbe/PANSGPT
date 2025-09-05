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
  selected.push(remaining.shift());
  
  while (selected.length < maxResults && remaining.length > 0) {
    let bestIdx = 0;
    let bestScore = -1;
    
    for (let i = 0; i < remaining.length; i++) {
      const relevance = remaining[i].$similarity || 0.5;
      
      // Calculate diversity based on query index differences
      const queryIndexDiversity = Math.min(...selected.map(s => {
        const selectedQueryIndex = s._queryIndex || 0;
        const currentQueryIndex = remaining[i]._queryIndex || 0;
        return Math.abs(selectedQueryIndex - currentQueryIndex) / 10; // Normalize by max expected queries
      }));
      
      // Combine similarity diversity and query index diversity
      const similarityDiversity = Math.min(...selected.map(s => 
        1 - (s.$similarity || 0.5)
      ));
      
      const totalDiversity = (queryIndexDiversity + similarityDiversity) / 2;
      const mmrScore = lambda * relevance + (1 - lambda) * totalDiversity;
      
      if (mmrScore > bestScore) {
        bestScore = mmrScore;
        bestIdx = i;
      }
    }
    
    selected.push(remaining.splice(bestIdx, 1)[0]);
  }
  
  return selected;
}

export async function GET() {
  return new Response("Hello, world!");
}

// Export a POST handler that returns 501 for unsupported methods
export async function POST(request: Request) {
  try {
    const { query, filters = {} } = await request.json();
    console.log('Search request:', { query, filters });

    if (!query) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    // Search in Astra DB using vector similarity
    console.log('Connecting to AstraDB...');
    const client = await getClient();
    const collection = client.collection(ASTRA_DB_COLLECTION);

    // Build filter conditions based on source filters
    const filterConditions: any = {};
    
    if (filters.author) {
      filterConditions["metadata.professorName"] = filters.author;
    }
    
    if (filters.topic) {
      filterConditions["metadata.topic"] = filters.topic.trim();
    }
    if (filters.courseCode) {
      filterConditions["metadata.courseCode"] = filters.courseCode.trim();
    }
    if (filters.level) {
      filterConditions["metadata.level"] = filters.level.trim();
    }

    console.log('Search filter conditions:', filterConditions);

    let allResults: any[] = [];

    // Try vector search first if embedding service is available
    try {
      console.log('Getting embeddings from Jina API...');
      
      // Generate diverse queries for better coverage
      const expandedQueries = expandQuery(query, filters.topic, filters.courseCode);
      console.log('Expanded queries:', expandedQueries);
      
      // Get embeddings for all expanded queries using Jina API
      const embeddings = await generateEmbeddings(expandedQueries);
      console.log('Got embedding response:', { 
        hasEmbeddings: !!embeddings,
        embeddingSize: embeddings?.[0]?.length 
      });

      // Search with each expanded query
      for (let i = 0; i < embeddings.length; i++) {
        const queryEmbedding = embeddings[i];
        const currentQuery = expandedQueries[i];
        
        console.log(`Searching with query ${i + 1}: "${currentQuery}"`);
        
        // Try vector search with filters first
        let queryResults = await collection.find(
          filterConditions,
          {
            sort: {
              $vector: queryEmbedding
            },
            limit: Math.ceil((filters.max_chunks || 10) / expandedQueries.length),
            includeSimilarity: true
          }
        ).toArray();

        // If no results with filters, try without filters
        if (queryResults.length === 0) {
          console.log(`No results with filters for query "${currentQuery}", trying without filters...`);
          queryResults = await collection.find(
            {},
            {
              sort: {
                $vector: queryEmbedding
              },
              limit: Math.ceil((filters.max_chunks || 10) / expandedQueries.length),
              includeSimilarity: true
            }
          ).toArray();
          
          // Filter results in memory if we got any
          if (queryResults.length > 0) {
            console.log(`Found ${queryResults.length} results without filters for query "${currentQuery}", filtering in memory...`);
            queryResults = queryResults.filter(doc => {
              const matchesTopic = !filters.topic || doc.metadata?.topic === filters.topic;
              const matchesCourseCode = !filters.courseCode || doc.metadata?.courseCode === filters.courseCode;
              const matchesLevel = !filters.level || doc.metadata?.level === filters.level;
              const matchesAuthor = !filters.author || 
                doc.metadata?.professorName?.toLowerCase().includes(filters.author.toLowerCase()) ||
                doc.metadata?.author?.toLowerCase().includes(filters.author.toLowerCase());
              return matchesTopic && matchesCourseCode && matchesLevel && matchesAuthor;
            });
            console.log(`After in-memory filtering: ${queryResults.length} results for query "${currentQuery}"`);
          }
        }

        // Add query identifier to results for diversity
        queryResults.forEach(result => {
          result._queryIndex = i;
          result._queryText = currentQuery;
        });
        
        allResults.push(...queryResults);
      }

      // Apply MMR diversity to the combined results
      if (allResults.length > 0) {
        console.log(`Applying MMR diversity to ${allResults.length} total results`);
        
        // Pre-process to ensure query index diversity
        const queryIndexGroups = new Map();
        allResults.forEach(result => {
          const queryIndex = result._queryIndex || 0;
          if (!queryIndexGroups.has(queryIndex)) {
            queryIndexGroups.set(queryIndex, []);
          }
          queryIndexGroups.get(queryIndex).push(result);
        });
        
        console.log(`Found results from ${queryIndexGroups.size} different query indexes`);
        
        // Take top results from each query index to ensure diversity
        const maxPerQuery = Math.ceil((filters.max_chunks || 10) / queryIndexGroups.size);
        const diverseResults = [];
        for (const [queryIndex, results] of queryIndexGroups) {
          const topResults = results
            .sort((a: any, b: any) => (b.$similarity || 0) - (a.$similarity || 0))
            .slice(0, maxPerQuery);
          diverseResults.push(...topResults);
        }
        
        // Apply MMR to the diverse results
        allResults = mmrDiversify(
          diverseResults, 
          embeddings[0], // Use first query embedding for diversity
          0.3, // Lower lambda to favor diversity more
          filters.max_chunks || 10
        );
        console.log(`After MMR diversity: ${allResults.length} results`);
        
        // Log first result for debugging
        if (allResults.length > 0) {
          const firstResult = allResults[0];
          console.log('Vector search results:', {
            count: allResults.length,
            firstResult: {
              hasChunkText: !!firstResult.chunk_text,
              hasMetadata: !!firstResult.metadata,
              hasSimilarity: !!firstResult.similarity,
              embeddingPresent: !!firstResult.embedding,
              similarityScore: firstResult.similarity,
              textPreview: firstResult.chunk_text?.substring(0, 100) + '...',
              queryIndex: firstResult._queryIndex,
              queryText: firstResult._queryText
            }
          });
        }
      }

      console.log('Vector search results:', {
        count: allResults.length,
        firstResult: allResults[0] ? {
          hasChunkText: !!allResults[0].chunk_text,
          hasMetadata: !!allResults[0].metadata,
          hasSimilarity: !!allResults[0].$similarity,
          embeddingPresent: !!allResults[0].embedding,
          similarityScore: allResults[0].$similarity,
          textPreview: allResults[0].chunk_text?.substring(0, 100),
          queryIndex: allResults[0]._queryIndex,
          queryText: allResults[0]._queryText
        } : null
      });
    } catch (embedError) {
      console.log('Embedding service error, falling back to text search:', embedError);
    }

    // If no vector search results or embedding service failed, return empty results
    if (allResults.length === 0) {
      console.log('No vector search results found, trying text search fallback...');
      
      // Fallback to text search with expanded queries
      const allDocs = await collection.find({}).toArray();
      const expandedQueries = expandQuery(query, filters.topic, filters.courseCode);
      
      for (const expandedQuery of expandedQueries) {
        const textSearchResults = allDocs.filter(doc => 
          doc.chunk_text?.toLowerCase().includes(expandedQuery.toLowerCase())
        );
        
        if (textSearchResults.length > 0) {
          console.log(`Text search fallback found ${textSearchResults.length} results for query "${expandedQuery}"`);
          allResults.push(...textSearchResults.slice(0, Math.ceil((filters.max_chunks || 5) / expandedQueries.length)));
        }
      }
      
      if (allResults.length > 0) {
        console.log(`Text search fallback found ${allResults.length} total results`);
        allResults = allResults.slice(0, filters.max_chunks || 5);
      } else {
        console.log('No text search results found either');
        return NextResponse.json({
          chunks: [],
          grouped_results: {},
          total: 0,
          query: query,
          metadata: {
            sources: [],
            topic_areas: [],
            document_types: []
          }
        });
      }
    }

    // Transform results to include similarity scores and enhanced metadata
    const chunks = allResults.map(doc => ({
      chunk_text: doc.chunk_text,
      metadata: {
        ...doc.metadata,
        author: doc.metadata?.author || doc.metadata?.professorName,
        relevance_score: doc.$similarity || 0.5, // Default score for text search results
        query_index: doc._queryIndex,
        query_text: doc._queryText,
        context: {
          section: doc.metadata?.section || 'main',
          topic_area: doc.metadata?.topic || 'general',
          document_type: doc.metadata?.type || 'unknown',
          course_info: {
            code: doc.metadata?.courseCode,
            title: doc.metadata?.courseTitle
          },
          professor: doc.metadata?.professorName,
          date: doc.metadata?.date,
          related_concepts: doc.metadata?.relatedConcepts || []
        }
      }
    }));

    interface GroupedChunks {
      [key: string]: {
        source_info: {
          course: {
            code: string | undefined;
            title: string | undefined;
          };
          professor: string | undefined;
          document_type: string;
          date: string | undefined;
        };
        chunks: typeof chunks[0][];
      };
    }

    // Group chunks by document/source for better context
    const groupedChunks = chunks.reduce<GroupedChunks>((acc, chunk) => {
      const sourceKey = `${chunk.metadata.context.course_info.code || ''} - ${chunk.metadata.context.professor || 'Unknown'}`;
      if (!acc[sourceKey]) {
        acc[sourceKey] = {
          source_info: {
            course: chunk.metadata.context.course_info,
            professor: chunk.metadata.context.professor,
            document_type: chunk.metadata.context.document_type,
            date: chunk.metadata.context.date
          },
          chunks: []
        };
      }
      acc[sourceKey].chunks.push(chunk);
      return acc;
    }, {});

    return NextResponse.json({
      chunks: chunks,
      grouped_results: groupedChunks,
      total: chunks.length,
      query: query,
      metadata: {
        sources: Object.keys(groupedChunks),
        topic_areas: [...new Set(chunks.map(c => c.metadata.context.topic_area))],
        document_types: [...new Set(chunks.map(c => c.metadata.context.document_type))]
      }
    });

  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Failed to search documents", details: error.message },
      { status: 500 }
    );
  }
}
