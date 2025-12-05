import { ChatMessage, streamChatResponse } from "@/lib/google-ai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getClient } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { readFile } from "fs/promises";
import { join } from "path";

const GOOGLE_API_KEY = process.env.GOOGLE_AI_API_KEY!;
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://pansgpt.vercel.app';

// Function to read general knowledge from file
async function getGeneralKnowledge(): Promise<string> {
  try {
    const filePath = join(process.cwd(), 'src', 'lib', 'general-knowledge.txt');
    const content = await readFile(filePath, 'utf-8');
    // Remove comments and empty lines, return clean content
    return content
      .split('\n')
      .filter(line => !line.trim().startsWith('#') && line.trim().length > 0)
      .join('\n')
      .trim();
  } catch (error) {
    console.error('Error reading general knowledge file:', error);
    return ''; // Return empty string if file doesn't exist or can't be read
  }
}

interface DocumentChunk {
  chunk_text: string;
  metadata: {
    source?: string;
    title?: string;
    author?: string;
    professorName?: string;
    date?: string;
    page?: number;
    section?: string;
    topic?: string;
    type?: string;
    relevance_score?: number;
    // Add the nested context structure that search API returns
    context?: {
      section: string;
      topic_area: string;
      document_type: string;
      course_info: {
        code?: string;
        title?: string;
      };
      professor?: string;
      date?: string;
      related_concepts?: string[];
    };
  };
}

export async function POST(req: Request) {
  try {
    const { message, conversationHistory = [] } = await req.json();

    if (!message) {
      return new Response(JSON.stringify({ error: "Message is required" }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Get user session to access user ID
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
    
    // Fetch user's current level from database to ensure it's up-to-date
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { level: true }
    });
    const userLevel = user?.level || session.user.level || null;

    // Extract source filters from the query
    const extractedFilters = extractSourceFilters(message);
    console.log('Extracted filters from message:', extractedFilters);
    
    // Search for relevant document chunks using fast chat search
    const searchResponse = await fetch(`${BASE_URL}/api/chat-search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        query: message,
        filters: {
          max_chunks: 8,
          level: userLevel,  // Filter by user's level
          ...extractedFilters  // Spread the extracted filters directly
        }
      }),
    });

    let context = "";
    let sources: string[] = [];
    let hasRelevantContent = false;
    let topicAreas: Set<string> = new Set();
    let documentTypes: Set<string> = new Set();
    // Track citations: lecturer name and document title
    let citations: Array<{ lecturerName: string; documentTitle: string }> = [];

    if (searchResponse.ok) {
      const { results } = await searchResponse.json();
      console.log('Fast chat search response received:', {
        hasResults: !!results,
        resultsLength: results?.length,
        resultsType: typeof results,
        firstResult: results?.[0] ? {
          hasChunkText: !!results[0].chunk_text,
          chunkTextLength: results[0].chunk_text?.length,
          hasMetadata: !!results[0].metadata,
          metadataKeys: results[0].metadata ? Object.keys(results[0].metadata) : [],
          source: results[0].metadata?.source,
          author: results[0].metadata?.author
        } : null
      });
      
      if (results && results.length > 0) {
        // Group chunks by source and metadata
        const sourceGroups = new Map<string, { 
          chunks: DocumentChunk[],
          relevance: number 
        }>();

        // Process and group results
        results.forEach((chunk: DocumentChunk) => {
          // Handle both old and new metadata structures
          const source = chunk.metadata?.source || 
                        (chunk.metadata?.context?.course_info?.code && chunk.metadata?.context?.professor 
                          ? `${chunk.metadata.context.course_info.code} - ${chunk.metadata.context.professor}`
                          : chunk.metadata?.context?.professor);
          
          console.log('Processing chunk:', {
            hasSource: !!source,
            source: source,
            hasChunkText: !!chunk.chunk_text,
            chunkTextLength: chunk.chunk_text?.length,
            hasContext: !!chunk.metadata?.context,
            contextKeys: chunk.metadata?.context ? Object.keys(chunk.metadata.context) : []
          });
          
          if (!source) {
            // Skip chunks with no valid source
            console.log('Skipping chunk with no source');
            return;
          }
          if (!sourceGroups.has(source)) {
            sourceGroups.set(source, { 
              chunks: [],
              relevance: chunk.metadata?.relevance_score || 0
            });
          }
          sourceGroups.get(source)?.chunks.push(chunk);

          // Track topic areas and document types - handle both structures
          const topic = chunk.metadata?.topic || chunk.metadata?.context?.topic_area;
          const type = chunk.metadata?.type || chunk.metadata?.context?.document_type;
          if (topic) topicAreas.add(topic);
          if (type) documentTypes.add(type);
        });

        console.log('Source groups created:', {
          sourceGroupsSize: sourceGroups.size,
          sourceGroupsKeys: Array.from(sourceGroups.keys())
        });

        // Build enhanced context with source information and metadata
        const contextParts: string[] = [];
        sourceGroups.forEach(({ chunks }, source) => {
          console.log('Building context for source:', source, {
            chunksCount: chunks.length
          });
          
          // Group chunks by section if available
          const sectionGroups = new Map<string, DocumentChunk[]>();
          chunks.forEach(chunk => {
            const section = chunk.metadata?.section || chunk.metadata?.context?.section || 'main';
            if (!sectionGroups.has(section)) {
              sectionGroups.set(section, []);
            }
            sectionGroups.get(section)?.push(chunk);
          });

          // Build source context with metadata - handle both structures
          const metadata = chunks[0].metadata;
          const titleInfo = metadata.title ? ` (${metadata.title})` : '';
          const authorInfo = (metadata.author || metadata.context?.professor) ? ` by ${metadata.author || metadata.context?.professor}` : '';
          const dateInfo = (metadata.date || metadata.context?.date) ? ` - ${metadata.date || metadata.context?.date}` : '';
          const typeInfo = (metadata.type || metadata.context?.document_type) ? ` [${metadata.type || metadata.context?.document_type}]` : '';
          
          let sourceContext = `Source: ${source}${titleInfo}${authorInfo}${dateInfo}${typeInfo}\n`;
          
          // Add section-organized content
          sectionGroups.forEach((sectionChunks, section) => {
            if (section !== 'main') {
              sourceContext += `\nSection: ${section}\n`;
            }
            sourceContext += sectionChunks
              .map(chunk => chunk.chunk_text.trim())
              .join("\n\n");
          });

          console.log('Source context built:', {
            sourceContextLength: sourceContext.length,
            sourceContextPreview: sourceContext.substring(0, 100) + '...'
          });

          contextParts.push(sourceContext);
          sources.push(source);
          
          // Collect citation information with better fallbacks
          const lecturerName = metadata.author || metadata.context?.professor || metadata.professorName || '';
          
          // Build document title with better prioritization - skip 'Untitled' and 'Unknown'
          let documentTitle = '';
          
          // First, try course info title (most specific)
          if (metadata.context?.course_info?.title && metadata.context.course_info.title !== 'Unknown') {
            documentTitle = metadata.context.course_info.title;
          }
          // Then try topic or topic_area (more descriptive than 'Untitled')
          else if (metadata.topic && metadata.topic !== 'General' && metadata.topic !== 'Untitled') {
            documentTitle = metadata.topic;
          }
          else if (metadata.context?.topic_area && metadata.context.topic_area !== 'General' && metadata.context.topic_area !== 'Untitled') {
            documentTitle = metadata.context.topic_area;
          }
          // Try original title if it's not 'Untitled'
          else if (metadata.title && metadata.title !== 'Untitled') {
            documentTitle = metadata.title;
          }
          // Try combining course code and topic if available
          else if (metadata.context?.course_info?.code && metadata.context.course_info.code !== 'Unknown') {
            const courseCode = metadata.context.course_info.code;
            const topic = metadata.topic || metadata.context?.topic_area;
            if (topic && topic !== 'General' && topic !== 'Untitled') {
              documentTitle = `${courseCode}: ${topic}`;
            } else {
              documentTitle = courseCode;
            }
          }
          // Extract from source if it's in "code - professor" format
          else if (source && source !== 'Unknown') {
            const sourceParts = source.split(' - ');
            if (sourceParts.length > 1) {
              documentTitle = sourceParts[0]; // Use course code part
            } else {
              documentTitle = source;
            }
          }
          // Last resort
          else {
            documentTitle = 'Course Materials';
          }
          
          // Add citation if we have at least a lecturer name or a meaningful document title
          if (lecturerName || (documentTitle && documentTitle !== 'Course Materials' && documentTitle !== 'Unknown')) {
            // Avoid duplicates
            const citationKey = `${lecturerName}|${documentTitle}`;
            if (!citations.some(c => `${c.lecturerName}|${c.documentTitle}` === citationKey)) {
              citations.push({ 
                lecturerName: lecturerName || 'Unknown Lecturer', 
                documentTitle: documentTitle 
              });
            }
          }
        });
        
        context = contextParts.join("\n\n---\n\n");
        hasRelevantContent = true;
        
        console.log('Final context built:', {
          contextLength: context.length,
          contextPreview: context.substring(0, 200) + '...',
          sourcesCount: sources.length,
          topicAreasCount: topicAreas.size,
          documentTypesCount: documentTypes.size
        });
        
        // Fallback: if no context was built but we have results, build a simple context
        if (context.length === 0 && results.length > 0) {
          console.log('No context built from source groups, building fallback context');
          const fallbackContext = results
            .map((chunk: DocumentChunk) => chunk.chunk_text)
            .filter((text: string) => text && text.trim().length > 0)
            .join("\n\n---\n\n");
          
          if (fallbackContext.length > 0) {
            context = fallbackContext;
            hasRelevantContent = true;
            
            // Collect citations from fallback results with better fallbacks
            results.forEach((chunk: DocumentChunk) => {
              const metadata = chunk.metadata;
              const source = metadata.source || 
                            (metadata.context?.course_info?.code && metadata.context?.professor 
                              ? `${metadata.context.course_info.code} - ${metadata.context.professor}`
                              : metadata.context?.professor) || '';
              const lecturerName = metadata.author || metadata.context?.professor || metadata.professorName || '';
              
              // Build document title with better prioritization - skip 'Untitled' and 'Unknown'
              let documentTitle = '';
              
              // First, try course info title (most specific)
              if (metadata.context?.course_info?.title && metadata.context.course_info.title !== 'Unknown') {
                documentTitle = metadata.context.course_info.title;
              }
              // Then try topic or topic_area (more descriptive than 'Untitled')
              else if (metadata.topic && metadata.topic !== 'General' && metadata.topic !== 'Untitled') {
                documentTitle = metadata.topic;
              }
              else if (metadata.context?.topic_area && metadata.context.topic_area !== 'General' && metadata.context.topic_area !== 'Untitled') {
                documentTitle = metadata.context.topic_area;
              }
              // Try original title if it's not 'Untitled'
              else if (metadata.title && metadata.title !== 'Untitled') {
                documentTitle = metadata.title;
              }
              // Try combining course code and topic if available
              else if (metadata.context?.course_info?.code && metadata.context.course_info.code !== 'Unknown') {
                const courseCode = metadata.context.course_info.code;
                const topic = metadata.topic || metadata.context?.topic_area;
                if (topic && topic !== 'General' && topic !== 'Untitled') {
                  documentTitle = `${courseCode}: ${topic}`;
                } else {
                  documentTitle = courseCode;
                }
              }
              // Extract from source if it's in "code - professor" format
              else if (source && source !== 'Unknown') {
                const sourceParts = source.split(' - ');
                if (sourceParts.length > 1) {
                  documentTitle = sourceParts[0]; // Use course code part
                } else {
                  documentTitle = source;
                }
              }
              // Last resort
              else {
                documentTitle = 'Course Materials';
              }
              
              // Add citation if we have at least a lecturer name or a meaningful document title
              if (lecturerName || (documentTitle && documentTitle !== 'Course Materials' && documentTitle !== 'Unknown')) {
                const citationKey = `${lecturerName}|${documentTitle}`;
                if (!citations.some(c => `${c.lecturerName}|${c.documentTitle}` === citationKey)) {
                  citations.push({ 
                    lecturerName: lecturerName || 'Unknown Lecturer', 
                    documentTitle: documentTitle 
                  });
                }
              }
            });
            
            console.log('Fallback context built:', {
              contextLength: context.length,
              contextPreview: context.substring(0, 200) + '...'
            });
          }
        }
      } else {
        console.log('No chunks found in search response');
      }
    } else {
      console.log('Search response not ok:', searchResponse.status, searchResponse.statusText);
    }

    // Add this helper function above the POST handler
    function extractSourceFilters(query: string): Record<string, string> {
      const filters: Record<string, string> = {};
      
      // Check for professor/author mentions - improved patterns
      const authorMatch = query.match(/according to (?:dr\.? )?(\w+)/i) || 
                         query.match(/from (?:dr\.? )?(\w+)/i) ||
                         query.match(/by (?:professor|prof\.? )?(\w+)/i) ||
                         query.match(/prof\.? (\w+)/i) ||
                         query.match(/dr\.? (\w+)/i) ||
                         query.match(/professor (\w+)/i) ||
                         query.match(/(\w+) (?:teach|teaches|course|notes|lecture)/i);
      if (authorMatch) {
        filters.author = authorMatch[1];
      }

      // Check for document type mentions
      const typeMatch = query.match(/(notes?|slides?|lecture|document|paper) on/i);
      if (typeMatch) {
        filters.type = typeMatch[1].toLowerCase();
      }

      // Check for topic mentions
      const topicMatch = query.match(/on ([^,\.]+?)(?:,|\.|define|explain|describe|what|how)/i);
      if (topicMatch) {
        filters.topic = topicMatch[1].trim();
      }

      return filters;
    }

    // Determine if the user explicitly requests document references - improved logic
    const docKeywords = [
      'document', 'source', 'notes', 'reference', 'slide', 'paper', 'according to', 'from', 'by professor', 'prof.', 'dr.'
    ];
    const messageLower = message.toLowerCase();
    const userWantsDocs = docKeywords.some(kw => messageLower.includes(kw)) || 
                         messageLower.includes('according to') ||
                         messageLower.includes('dr.') ||
                         messageLower.includes('professor');
    
    // Detect if user is asking for a list of documents
    const listKeywords = ['list', 'show', 'what documents', 'available documents', 'documents for', 'courses for', 'materials for'];
    const isAskingForList = listKeywords.some(kw => messageLower.includes(kw)) && 
                           (messageLower.includes('document') || messageLower.includes('course') || messageLower.includes('material') || messageLower.includes('level'));

    // Debug logging
    console.log('Chat request debug:', {
      message,
      userWantsDocs,
      hasRelevantContent,
      contextLength: context.length,
      sources: sources.length,
      extractedFilters: extractSourceFilters(message)
    });

    // If user is asking for a list of documents, fetch actual documents from database
    let actualDocumentsList = '';
    if (isAskingForList) {
      try {
        const client = await getClient();
        const documentsCollection = client.collection('documents');
        
        // Build filter for user's level
        const docFilter: any = {};
        if (userLevel) {
          docFilter.level = userLevel;
        }
        
        // Fetch actual documents
        const actualDocs = await documentsCollection.find(docFilter).toArray();
        
        if (actualDocs.length > 0) {
          // Group by course code for better organization
          const docsByCourse = new Map<string, any[]>();
          actualDocs.forEach((doc: any) => {
            const courseKey = doc.course_code || 'Uncategorized';
            if (!docsByCourse.has(courseKey)) {
              docsByCourse.set(courseKey, []);
            }
            docsByCourse.get(courseKey)!.push(doc);
          });
          
          // Build formatted list
          const docListParts: string[] = [];
          docListParts.push(`ACTUAL DOCUMENTS AVAILABLE FOR ${userLevel} LEVEL:\n`);
          
          docsByCourse.forEach((docs, courseCode) => {
            const courseTitle = docs[0].course_title || 'Unknown Course';
            docListParts.push(`\n${courseCode} - ${courseTitle}:`);
            docs.forEach(doc => {
              const profName = doc.professor_name || 'Unknown Professor';
              const docTitle = doc.title || doc.file_name || 'Untitled';
              const topic = doc.topic ? ` (Topic: ${doc.topic})` : '';
              docListParts.push(`  - ${docTitle} by ${profName}${topic}`);
            });
          });
          
          actualDocumentsList = docListParts.join('\n');
        } else {
          actualDocumentsList = `No documents found in the database for ${userLevel} level.`;
        }
      } catch (error) {
        console.error('Error fetching actual documents:', error);
        actualDocumentsList = 'Unable to retrieve document list from database.';
      }
    }

    // Limit context length to prevent token overflow
    const maxContextLength = 2000; // characters
    if (context.length > maxContextLength) {
      context = context.substring(0, maxContextLength) + "...\n\n[Context truncated for length]";
    }

    // Read general knowledge from file
    const generalKnowledge = await getGeneralKnowledge();
    const generalKnowledgeSection = generalKnowledge 
      ? `\n\nGENERAL KNOWLEDGE BASE:\n${generalKnowledge}\n` 
      : '';

    // Update the system message to only reference documents if user requests it
    let systemMessage = "You are PansGPT, a specialized web-based academic learning platform. You function as an AI-powered assistant designed to support students. You are built exclusively for the students of the Faculty of Pharmaceutical Sciences at the University of Jos, Nigeria. The userbase is referred to as \"PANSites.\"";
    
    // Always use document context if we have relevant content and user is asking for specific sources
    const shouldUseDocs = (userWantsDocs && hasRelevantContent) || 
                         (hasRelevantContent && (messageLower.includes('according to') || messageLower.includes('dr.') || messageLower.includes('professor')));
    
    // If user is asking for specific documents/sources but no level-appropriate content is found, 
    // set up a friendly response about level restrictions
    if (userWantsDocs && !hasRelevantContent) {
      // Get available materials for their level
      const availableTopics = Array.from(topicAreas).length > 0 ? Array.from(topicAreas).join(', ') : 'various topics';
      const availableTypes = Array.from(documentTypes).length > 0 ? Array.from(documentTypes).join(', ') : 'lecture notes, readings, and other materials';
      
      // Create a friendly system message for level restrictions
      systemMessage = `You are PansGPT, a specialized web-based academic learning platform. You function as an AI-powered assistant designed to support students. You are built exclusively for the students of the Faculty of Pharmaceutical Sciences at the University of Jos, Nigeria. The userbase is referred to as "PANSites."

You have an empathetic and warm communication style. The user (a PANSite) is asking about specific documents or sources, but you don't have access to those materials because they are not available for their current academic level.

The user is at the ${userLevel} academic level. The documents they're asking about are either from a higher level (more advanced) or a lower level (more basic) than their current level.

However, you DO have access to materials appropriate for their ${userLevel} level, including:
- Topics: ${availableTopics}
- Document types: ${availableTypes}

Respond in a friendly, empathetic, and helpful way that:
1. Acknowledges their question warmly
2. Explains that the materials they're asking about are not available for their current level (could be too advanced or too basic)
3. Tells them what materials ARE available for their current level (${userLevel})
4. Suggests they ask about the available topics or materials
5. Offers to help them find appropriate materials for their level

Be encouraging and helpful, not restrictive. Show them what they CAN access rather than what they can't. Answer only the question asked - do not provide extra information unless specifically requested.`;
      
      // Set up the AI response to be friendly about level restrictions
      const messagesForAI: ChatMessage[] = [
        { role: "system", content: systemMessage },
        { role: "user", content: message }
      ];
      
      // Generate a friendly response about level restrictions
      const encoder = new TextEncoder();
      let firstChunk = true;
      const stream = new ReadableStream({
        async start(controller) {
          try {
            await streamChatResponse(GOOGLE_API_KEY, messagesForAI, {
              maxOutputTokens: 1024,
              temperature: 0.1,
              topK: 40,
              topP: 0.95,
            }, (chunk) => {
              const data = JSON.stringify({ chunk });
              if (!firstChunk) controller.enqueue(encoder.encode("\n"));
              controller.enqueue(encoder.encode(data));
              firstChunk = false;
            });
            controller.close();
          } catch (err) {
            controller.error(err);
          }
        }
      });
      
      return new Response(stream, {
        headers: {
          'Content-Type': 'application/x-ndjson',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Transfer-Encoding': 'chunked',
        },
      });
    }
    
    if (shouldUseDocs) {
      // Add document list to context if user is asking for a list
      const documentListSection = actualDocumentsList ? `\n\n${actualDocumentsList}\n` : '';
      
      systemMessage = `You are PansGPT, a specialized web-based academic learning platform. You function as an AI-powered assistant designed to support students. You are built exclusively for the students of the Faculty of Pharmaceutical Sciences at the University of Jos, Nigeria. The userbase is referred to as "PANSites."

You have an empathetic and warm communication style. You have access to a curated database of course materials and documents from the Faculty of Pharmaceutical Sciences at the University of Jos.
The user (a PANSite) is asking for specific information from documents or sources.

CRITICAL RULES - YOU MUST FOLLOW THESE STRICTLY:
1. ONLY use information that is explicitly provided in the CONTEXT FROM DOCUMENTS section below.
2. DO NOT make up, fabricate, or invent any information, document names, course codes, lecturer names, or topics.
3. DO NOT use information from your training data or general knowledge unless it's in the provided context.
4. If the information is NOT in the provided context, explicitly state: "I don't have that information in the available documents."
5. If asked to list documents, ONLY list documents that appear in the ACTUAL DOCUMENTS section below. Do not invent or guess document names.
6. When citing sources, ONLY cite sources that appear in the context provided below.

The user is at the ${userLevel || 'unspecified'} academic level. Tailor your explanations, examples, and language to be appropriate for this level.

COMMUNICATION STYLE: Be empathetic, warm, and understanding in your responses. When users greet you, respond warmly and enthusiastically. Answer ONLY the questions asked - do not provide additional information, examples, or explanations unless the user specifically requests them. Be direct and concise while maintaining a friendly, supportive tone.

Please format your responses using clear visual hierarchy by employing bold, numbered lists, subheadings, bullet points, and well-structured tables. Use line breaks between sections and concepts to reduce visual clutter. Do not use different text sizes or heading tags (like h1/h2); keep all text the same size and rely on formatting and spacing for structure.

TABLE FORMATTING: When presenting data, comparisons, or structured information, use proper markdown tables with clear headers and aligned columns. Format tables like this:

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Data 1   | Data 2   | Data 3   |
| Data 4   | Data 5   | Data 6   |

For chemical data, use tables with headers like "Substance", "Formula", "Molar Mass", etc. For comparisons, use clear comparative headers. Always include proper markdown table separators (|) and ensure data is properly aligned.
IMPORTANT: For every chemical formula, ion, mathematical equation, calculation, or symbol (even inline), ALWAYS wrap it in LaTeX math delimiters: use $...$ for inline and $$...$$ for block. Do not use plain text for any formulas or symbols. For example: $H_3O^+$, $OH^-$, $x^2 + y^2 = r^2$, $$2H_2O(l) \rightleftharpoons H_3O^+(aq) + OH^-(aq)$$. Repeat: EVERY formula, symbol, or equation must be wrapped in math delimiters.
IMPORTANT: For all chemical equations, formulas, and mathematical expressions, always wrap them in LaTeX math delimiters: use $$...$$ for display (block) and $...$ for inline. For example: $$HCl(aq) + NaOH(aq) \\rightarrow H_2O(l) + NaCl(aq)$$

${documentListSection}I found relevant information in the database for this query across ${sources.length} sources, covering ${Array.from(topicAreas).join(", ") || "various"} topics from ${Array.from(documentTypes).join(", ") || "various"} document types.

CONTEXT FROM DOCUMENTS:
${context}

REMINDER: ONLY use information from the CONTEXT FROM DOCUMENTS section above. Do not fabricate or invent any information. If information is not in the context, say so explicitly. Provide direct, clear answers using document information. Be concise unless asked for details. Answer ONLY the question asked - do not provide extra information unless specifically requested. Cite sources as "According to [Source]..." when relevant, but ONLY cite sources that appear in the context above. For math, use LaTeX notation ($$...$$ for display, \\(...\\) for inline).`;
    } else if (hasRelevantContent) {
      // If we have content but user didn't explicitly ask for docs, offer it
      const documentListSection = actualDocumentsList ? `\n\n${actualDocumentsList}\n` : '';
      
      systemMessage = `You are PansGPT, a specialized web-based academic learning platform. You function as an AI-powered assistant designed to support students. You are built exclusively for the students of the Faculty of Pharmaceutical Sciences at the University of Jos, Nigeria. The userbase is referred to as "PANSites."

You have an empathetic and warm communication style. You have access to a curated database of course materials and documents from the Faculty of Pharmaceutical Sciences at the University of Jos.

CRITICAL RULES - YOU MUST FOLLOW THESE STRICTLY:
1. ONLY use information that is explicitly provided in the context sections below.
2. DO NOT make up, fabricate, or invent any information, document names, course codes, lecturer names, or topics.
3. If the information is NOT in the provided context, do not invent it - use only what's provided.

The user (a PANSite) is at the ${userLevel || 'unspecified'} academic level. Tailor your explanations, examples, and language to be appropriate for this level.

COMMUNICATION STYLE: Be empathetic, warm, and understanding in your responses. When users greet you, respond warmly and enthusiastically. Answer ONLY the questions asked - do not provide additional information, examples, or explanations unless the user specifically requests them. Be direct and concise while maintaining a friendly, supportive tone.

Please format your responses using clear visual hierarchy by employing bold, numbered lists, subheadings, bullet points, and well-structured tables. Use line breaks between sections and concepts to reduce visual clutter. Do not use different text sizes or heading tags (like h1/h2); keep all text the same size and rely on formatting and spacing for structure.

TABLE FORMATTING: When presenting data, comparisons, or structured information, use proper markdown tables with clear headers and aligned columns. Format tables like this:

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Data 1   | Data 2   | Data 3   |
| Data 4   | Data 5   | Data 6   |

For chemical data, use tables with headers like "Substance", "Formula", "Molar Mass", etc. For comparisons, use clear comparative headers. Always include proper markdown table separators (|) and ensure data is properly aligned.
IMPORTANT: For every chemical formula, ion, mathematical equation, calculation, or symbol (even inline), ALWAYS wrap it in LaTeX math delimiters: use $...$ for inline and $$...$$ for block. Do not use plain text for any formulas or symbols. For example: $H_3O^+$, $OH^-$, $x^2 + y^2 = r^2$, $$2H_2O(l) \rightleftharpoons H_3O^+(aq) + OH^-(aq)$$. Repeat: EVERY formula, symbol, or equation must be wrapped in math delimiters.
IMPORTANT: For all chemical equations, formulas, and mathematical expressions, always wrap them in LaTeX math delimiters: use $$...$$ for display (block) and $...$ for inline. For example: $$HCl(aq) + NaOH(aq) \\rightarrow H_2O(l) + NaCl(aq)$$

${documentListSection}I found some relevant information in the database that might be helpful:

${context}${generalKnowledgeSection}

You can use this information to enhance your response. However, ONLY use information from the context above. Do not fabricate or invent information. Answer ONLY the question asked - do not provide extra information unless specifically requested.`;
    } else {
      systemMessage = `You are PansGPT, a specialized web-based academic learning platform. You function as an AI-powered assistant designed to support students. You are built exclusively for the students of the Faculty of Pharmaceutical Sciences at the University of Jos, Nigeria. The userbase is referred to as "PANSites."

You have an empathetic and warm communication style. Reply warmly and enthusiastically to greetings, general, or non-document questions. Only reference documents if the user explicitly asks for them.
The user (a PANSite) is at the ${userLevel || 'unspecified'} academic level. Tailor your explanations, examples, and language to be appropriate for this level.

COMMUNICATION STYLE: Be empathetic, warm, and understanding in your responses. When users greet you (e.g., "hello", "hi", "hey", "good morning", "good afternoon"), respond warmly and enthusiastically with a friendly greeting. Answer ONLY the questions asked - do not provide additional information, examples, or explanations unless the user specifically requests them. Be direct and concise while maintaining a friendly, supportive tone.

Please format your responses using clear visual hierarchy by employing bold, numbered lists, subheadings, bullet points, and well-structured tables. Use line breaks between sections and concepts to reduce visual clutter. Do not use different text sizes or heading tags (like h1/h2); keep all text the same size and rely on formatting and spacing for structure.

TABLE FORMATTING: When presenting data, comparisons, or structured information, use proper markdown tables with clear headers and aligned columns. Format tables like this:

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Data 1   | Data 2   | Data 3   |
| Data 4   | Data 5   | Data 6   |

For chemical data, use tables with headers like "Substance", "Formula", "Molar Mass", etc. For comparisons, use clear comparative headers. Always include proper markdown table separators (|) and ensure data is properly aligned.
Do not cite sources or reference documents unless the user requests it. Remember to answer ONLY the question asked - do not provide extra information unless specifically requested.
IMPORTANT: For every chemical formula, ion, mathematical equation, calculation, or symbol (even inline), ALWAYS wrap it in LaTeX math delimiters: use $...$ for inline and $$...$$ for block. Do not use plain text for any formulas or symbols. For example: $H_3O^+$, $OH^-$, $x^2 + y^2 = r^2$, $$2H_2O(l) \rightleftharpoons H_3O^+(aq) + OH^-(aq)$$. Repeat: EVERY formula, symbol, or equation must be wrapped in math delimiters.
IMPORTANT: For all chemical equations, formulas, and mathematical expressions, always wrap them in LaTeX math delimiters: use $$...$$ for display (block) and $...$ for inline. For example: $$HCl(aq) + NaOH(aq) \\rightarrow H_2O(l) + NaCl(aq)$$${generalKnowledgeSection}`;
    }

    // Use Google Gemma model for chat response with optimized parameters
    const messagesForAI: ChatMessage[] = [
      { role: "system", content: systemMessage },
      ...conversationHistory.slice(-6).map((msg: any) => ({ role: msg.role, content: msg.content })), // Limit history to last 6 messages
      { role: "user", content: message }
    ];
    
    // Debug logging for AI context
    console.log('AI Context Debug:', {
      shouldUseDocs,
      hasRelevantContent,
      contextLength: context.length,
      systemMessageLength: systemMessage.length,
      contextPreview: context.substring(0, 200) + '...',
      userMessage: message
    });
    
    // Streaming response
    const encoder = new TextEncoder();
    let firstChunk = true;
    const stream = new ReadableStream({
      async start(controller) {
        try {
          await streamChatResponse(GOOGLE_API_KEY, messagesForAI, {
            maxOutputTokens: 4096,
            temperature: 0.1,
            topK: 40,
            topP: 0.95,
          }, (chunk) => {
            // Stream as NDJSON for easy client parsing
            const data = JSON.stringify({ chunk });
            if (!firstChunk) controller.enqueue(encoder.encode("\n"));
            controller.enqueue(encoder.encode(data));
            firstChunk = false;
          });
          
          // Send citations metadata after streaming completes (whenever documents were actually used)
          // Send citations if we have citations and relevant content was used, regardless of whether user explicitly asked for docs
          if (citations.length > 0 && hasRelevantContent) {
            const citationsData = JSON.stringify({ type: 'citations', citations });
            controller.enqueue(encoder.encode("\n"));
            controller.enqueue(encoder.encode(citationsData));
          }
          
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      }
    });
    return new Response(stream, {
      headers: {
        'Content-Type': 'application/x-ndjson',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error("Error in chat API:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
