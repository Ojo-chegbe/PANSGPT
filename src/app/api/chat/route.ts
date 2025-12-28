import { ChatMessage, streamChatResponse } from "@/lib/google-ai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getClient } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { readFile } from "fs/promises";
import { join } from "path";
import { extractCourseInfo, getCourseCodesByAbbreviation } from "@/lib/course-code-mapper";

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
    const { message, conversationHistory = [], isStudyMode = false, studyContext } = await req.json();

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

    // Extract course information for enhanced search
    const courseInfo = extractCourseInfo(message);
    let searchQuery = message;

    // If we found a course abbreviation but no full code, enhance the query
    if (courseInfo.abbreviation && !courseInfo.courseCode) {
      const courseCodes = getCourseCodesByAbbreviation(courseInfo.abbreviation);
      if (courseCodes.length > 0) {
        // Add course titles to the query to improve search relevance
        const courseTitles = courseCodes
          .map(code => {
            const info = extractCourseInfo(code);
            return info.title;
          })
          .filter(Boolean)
          .join(' ');
        if (courseTitles) {
          searchQuery = `${message} ${courseTitles}`;
        }
      }
    }

    console.log('Extracted filters from message:', extractedFilters);
    console.log('Course info extracted:', courseInfo);

    // If in study mode, BYPASS SEARCH and directly explain the highlighted text
    // The message already contains the text the user wants explained
    if (isStudyMode && studyContext?.documentTitle) {
      console.log('Study mode detected - bypassing search, using message as context directly');

      const studyDocTitle = studyContext.documentTitle;
      const systemMessage = `You are PansGPT, a concise academic tutor helping a pharmacy student at the University of Jos.

**STUDY MODE**: The student is studying "${studyDocTitle}" and has highlighted text they want explained.

YOUR RULES:
1. Be CONCISE and STRAIGHT TO THE POINT - no lengthy introductions
2. Explain the concept in simple, clear terms
3. Use analogies only if they genuinely help understanding
4. Keep responses SHORT - aim for 3-5 key points maximum
5. DO NOT offer suggestions like "Would you like me to..." or list options
6. End with a simple: "Does this make sense?" or "Do you understand this concept?"
7. Only expand if the user asks for more detail

FORMAT:
- Use bold for key terms
- Use bullet points for lists
- Keep paragraphs short (2-3 sentences max)
- For formulas/equations, use LaTeX: $...$ for inline, $$...$$ for block

Remember: Your goal is clarity, not comprehensiveness. Make the concept click quickly.`;

      // Set up messages for AI in study mode
      const studyMessagesForAI: ChatMessage[] = [
        { role: "system", content: systemMessage },
        ...conversationHistory.map((msg: { role: string; content: string }) => ({
          role: msg.role as "user" | "model" | "system",
          content: msg.content
        })),
        { role: "user", content: message }
      ];

      // Stream the response
      const encoder = new TextEncoder();
      let firstChunk = true;
      const stream = new ReadableStream({
        async start(controller) {
          try {
            await streamChatResponse(GOOGLE_API_KEY, studyMessagesForAI, {
              maxOutputTokens: 2048,
              temperature: 0.3,
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
        }
      });
    }

    // Non-study mode: continue with search...

    // Search for relevant document chunks using fast chat search
    const searchFilters: Record<string, unknown> = {
      max_chunks: isStudyMode ? 12 : 8,  // Get more chunks in study mode
      level: userLevel,  // Filter by user's level
      ...extractedFilters  // Spread the extracted filters directly (includes courseCode if found)
    };

    // In study mode, ignore level filter to ensure we find the document
    if (isStudyMode) {
      delete searchFilters.level;
    }

    const searchResponse = await fetch(`${BASE_URL}/api/chat-search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: searchQuery,
        filters: searchFilters
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

      // Common words that should NOT be treated as author/professor names
      const ignoredWords = [
        'my', 'the', 'this', 'that', 'a', 'an', 'our', 'your', 'their',
        'some', 'any', 'all', 'every', 'said', 'student', 'students',
        'his', 'her', 'its', 'study', 'course', 'class', 'material', 'materials',
        'note', 'notes', 'lecture', 'lectures', 'document', 'documents',
        'book', 'books', 'text', 'texts', 'slide', 'slides', 'content'
      ];

      // Extract course code information
      const courseInfo = extractCourseInfo(query);
      if (courseInfo.courseCode) {
        // If we found a full course code, use it
        filters.courseCode = courseInfo.courseCode;
        console.log('Extracted course code:', courseInfo.courseCode, 'Title:', courseInfo.title);
      } else if (courseInfo.abbreviation) {
        // If we found an abbreviation, we'll need to handle it differently
        // For now, we'll note it but can't filter by abbreviation directly
        // The search will need to match any course starting with that abbreviation
        console.log('Extracted course abbreviation:', courseInfo.abbreviation, 'Title:', courseInfo.title);
        // Note: We can't filter by abbreviation in the current search, but we can enhance the query
      }

      // Check for professor/author mentions - improved patterns
      const authorMatch = query.match(/according to (?:dr\.? )?(\w+)/i) ||
        query.match(/from (?:dr\.? )?(\w+)/i) ||
        query.match(/by (?:professor|prof\.? )?(\w+)/i) ||
        query.match(/prof\.? (\w+)/i) ||
        query.match(/dr\.? (\w+)/i) ||
        query.match(/professor (\w+)/i) ||
        query.match(/(\w+) (?:teach|teaches|course|notes|lecture)/i);

      // Only add author filter if the matched word is not a common/ignored word
      if (authorMatch) {
        const potentialAuthor = authorMatch[1].toLowerCase();
        if (!ignoredWords.includes(potentialAuthor)) {
          filters.author = authorMatch[1];
        } else {
          console.log('Ignoring common word as author:', authorMatch[1]);
        }
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

    // Build course code context for AI if course was detected
    let courseCodeContext = '';
    if (courseInfo.courseCode) {
      courseCodeContext = `\n\nCOURSE CONTEXT: The user is asking about ${courseInfo.courseCode} - ${courseInfo.title || 'a course'}. When searching for information, prioritize documents related to this specific course code.`;
    } else if (courseInfo.abbreviation) {
      courseCodeContext = `\n\nCOURSE CONTEXT: The user mentioned the course abbreviation "${courseInfo.abbreviation}" (${courseInfo.title || 'course category'}). When searching for information, prioritize documents related to courses in this category.`;
    }

    // Update the system message to only reference documents if user requests it
    let systemMessage = "You are PansGPT, a specialized web-based academic learning platform. You function as an AI-powered assistant designed to support students. You are built exclusively for the students of the Faculty of Pharmaceutical Sciences at the University of Jos, Nigeria. The userbase is referred to as \"PANSites.\"\n\nCOURSE CODE MATCHING: You can recognize and match course codes (e.g., PCG 211, PCH 311) and course abbreviations (e.g., PCG for Pharmacognosy, PCH for Pharmaceutical Chemistry). When users mention course codes or abbreviations, search the database for documents specifically related to those courses." + courseCodeContext;

    // In STUDY MODE, use a special system prompt that always explains without restrictions
    if (isStudyMode && hasRelevantContent) {
      const studyDocTitle = studyContext?.documentTitle || 'their study material';
      systemMessage = `You are PansGPT, a specialized academic learning assistant helping a student study their course materials at the Faculty of Pharmaceutical Sciences, University of Jos.

**STUDY MODE ACTIVE**: The student is actively studying "${studyDocTitle}" and has asked you to explain or elaborate on specific content from this document.

YOUR BEHAVIOR IN STUDY MODE:
1. ALWAYS provide thorough explanations - do not refuse or redirect based on academic level
2. Use the CONTEXT PROVIDED to give accurate, detailed explanations
3. If the concept is advanced, STILL explain it - use simpler terms and analogies when helpful
4. Be educational and supportive, like a helpful tutor
5. Include relevant examples to make concepts clearer
6. If asked to quiz or give examples, do so enthusiastically

AVAILABLE CONTEXT FROM THE STUDY DOCUMENT:
${context}

Use this context to answer the student's question thoroughly and educationally.`;

      // Set up messages for AI in study mode
      const studyMessagesForAI: ChatMessage[] = [
        { role: "system", content: systemMessage },
        ...conversationHistory.map((msg: { role: string; content: string }) => ({
          role: msg.role as "user" | "model" | "system",
          content: msg.content
        })),
        { role: "user", content: message }
      ];

      // Stream the response
      const encoder = new TextEncoder();
      let firstChunk = true;
      const stream = new ReadableStream({
        async start(controller) {
          try {
            // Send citations first if we have them
            if (citations.length > 0) {
              const citationsData = JSON.stringify({ type: 'citations', citations });
              controller.enqueue(encoder.encode(citationsData + "\n"));
            }

            await streamChatResponse(GOOGLE_API_KEY, studyMessagesForAI, {
              maxOutputTokens: 2048,
              temperature: 0.3,
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
        }
      });
    }

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

COURSE CODE MATCHING: You can recognize and match course codes (e.g., PCG 211, PCH 311) and course abbreviations (e.g., PCG for Pharmacognosy, PCH for Pharmaceutical Chemistry). When users mention course codes or abbreviations, search the database for documents specifically related to those courses.${courseCodeContext}

HOW TO USE THE COURSE MATERIALS:
1. Use the provided context as a FOUNDATION to understand the concepts being discussed.
2. SYNTHESIZE and REASON from the material - don't just quote it verbatim.
3. You CAN and SHOULD combine information from the course materials with your general pharmaceutical/medical knowledge to provide comprehensive, educational answers.
4. When the material provides a concept, EXPLAIN it clearly using your understanding, don't just copy the text.
5. If the material mentions something briefly, you can EXPAND on it using general knowledge while noting what comes from the material.
6. DO NOT fabricate document names, course codes, lecturer names, or claim things exist in the material that don't.
7. When citing, cite the actual sources provided, not made-up ones.

The user is at the ${userLevel || 'unspecified'} academic level. Tailor your explanations, examples, and language to be appropriate for this level.

RESPONSE LENGTH - IMPORTANT:
Analyze the question to determine the appropriate response length:

**Give SHORT, CONCISE answers for:**
- Simple factual questions ("What is...", "Define...", "Name...")
- Yes/No questions
- Single-word or single-phrase answers
- Quick definitions
- Greetings and casual conversation
- Simple numerical answers or dates

**Give DETAILED, COMPREHENSIVE answers for:**
- "Explain..." or "Describe..." questions
- "How does X work?" or "Why does X happen?" questions
- "Compare and contrast..." questions
- "Discuss..." or "Elaborate..." requests
- Complex mechanism or process questions
- Questions about relationships between concepts
- When the user explicitly asks for details or examples

Match your response length to what the question actually requires. Don't over-explain simple questions or under-explain complex ones.

COMMUNICATION STYLE: Be empathetic, warm, and understanding in your responses. When users greet you, respond warmly and enthusiastically. Be helpful and informative.

Please format your responses using clear visual hierarchy by employing bold, numbered lists, subheadings, bullet points, and well-structured tables. Use line breaks between sections and concepts to reduce visual clutter. Do not use different text sizes or heading tags (like h1/h2); keep all text the same size and rely on formatting and spacing for structure.

TABLE FORMATTING: When presenting data, comparisons, or structured information, use proper markdown tables with clear headers and aligned columns. Format tables like this:

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Data 1   | Data 2   | Data 3   |
| Data 4   | Data 5   | Data 6   |

For chemical data, use tables with headers like "Substance", "Formula", "Molar Mass", etc. For comparisons, use clear comparative headers. Always include proper markdown table separators (|) and ensure data is properly aligned.
IMPORTANT: For every chemical formula, ion, mathematical equation, calculation, or symbol (even inline), ALWAYS wrap it in LaTeX math delimiters: use $...$ for inline and $$...$$ for block. Do not use plain text for any formulas or symbols. For example: $H_3O^+$, $OH^-$, $x^2 + y^2 = r^2$, $$2H_2O(l) \\rightleftharpoons H_3O^+(aq) + OH^-(aq)$$. Repeat: EVERY formula, symbol, or equation must be wrapped in math delimiters.
IMPORTANT: For all chemical equations, formulas, and mathematical expressions, always wrap them in LaTeX math delimiters: use $$...$$ for display (block) and $...$ for inline. For example: $$HCl(aq) + NaOH(aq) \\rightarrow H_2O(l) + NaCl(aq)$$

${documentListSection}I found relevant information in the database for this query across ${sources.length} sources, covering ${Array.from(topicAreas).join(", ") || "various"} topics from ${Array.from(documentTypes).join(", ") || "various"} document types.

CONTEXT FROM DOCUMENTS:
${context}

INSTRUCTIONS: Use the course material above as your primary reference. SYNTHESIZE the information - don't just quote it. Combine the material's concepts with your pharmaceutical knowledge to give the student a complete, educational answer. If the material covers the topic briefly, expand on it helpfully. The goal is to help the student UNDERSTAND, not just to repeat text. You can mention "According to your course materials..." when referencing specific content. For math, use LaTeX notation ($$...$$ for display, $...$ for inline).`;
    } else if (hasRelevantContent) {
      // If we have content but user didn't explicitly ask for docs, offer it
      const documentListSection = actualDocumentsList ? `\n\n${actualDocumentsList}\n` : '';

      systemMessage = `You are PansGPT, a specialized web-based academic learning platform. You function as an AI-powered assistant designed to support students. You are built exclusively for the students of the Faculty of Pharmaceutical Sciences at the University of Jos, Nigeria. The userbase is referred to as "PANSites."

You have an empathetic and warm communication style. You have access to a curated database of course materials and documents from the Faculty of Pharmaceutical Sciences at the University of Jos.

COURSE CODE MATCHING: You can recognize and match course codes (e.g., PCG 211, PCH 311) and course abbreviations (e.g., PCG for Pharmacognosy, PCH for Pharmaceutical Chemistry). When users mention course codes or abbreviations, search the database for documents specifically related to those courses.${courseCodeContext}

HOW TO ANSWER QUESTIONS:
1. Use the provided course material as a FOUNDATION and REFERENCE for your answer.
2. SYNTHESIZE the information creatively - don't just quote text verbatim.
3. COMBINE the course material with your general pharmaceutical/medical knowledge to provide comprehensive, educational answers.
4. Your goal is to HELP THE STUDENT UNDERSTAND the topic fully, not just repeat what's in the notes.
5. If the material covers something briefly, you can EXPAND on it with additional helpful context.
6. Be educational and thorough - explain concepts clearly.
7. DO NOT fabricate document names, course codes, or lecturer names.

The user (a PANSite) is at the ${userLevel || 'unspecified'} academic level. Tailor your explanations, examples, and language to be appropriate for this level.

RESPONSE LENGTH - IMPORTANT:
Analyze the question to determine the appropriate response length:

**Give SHORT, CONCISE answers for:**
- Simple factual questions ("What is...", "Define...", "Name...")
- Yes/No questions
- Single-word or single-phrase answers
- Quick definitions
- Greetings and casual conversation
- Simple numerical answers or dates

**Give DETAILED, COMPREHENSIVE answers for:**
- "Explain..." or "Describe..." questions
- "How does X work?" or "Why does X happen?" questions
- "Compare and contrast..." questions
- "Discuss..." or "Elaborate..." requests
- Complex mechanism or process questions
- Questions about relationships between concepts
- When the user explicitly asks for details or examples

Match your response length to what the question actually requires. Don't over-explain simple questions or under-explain complex ones.

COMMUNICATION STYLE: Be empathetic, warm, and understanding in your responses. When users greet you, respond warmly and enthusiastically. Be helpful and educational.

Please format your responses using clear visual hierarchy by employing bold, numbered lists, subheadings, bullet points, and well-structured tables. Use line breaks between sections and concepts to reduce visual clutter. Do not use different text sizes or heading tags (like h1/h2); keep all text the same size and rely on formatting and spacing for structure.

TABLE FORMATTING: When presenting data, comparisons, or structured information, use proper markdown tables with clear headers and aligned columns. Format tables like this:

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Data 1   | Data 2   | Data 3   |
| Data 4   | Data 5   | Data 6   |

For chemical data, use tables with headers like "Substance", "Formula", "Molar Mass", etc. For comparisons, use clear comparative headers. Always include proper markdown table separators (|) and ensure data is properly aligned.
IMPORTANT: For every chemical formula, ion, mathematical equation, calculation, or symbol (even inline), ALWAYS wrap it in LaTeX math delimiters: use $...$ for inline and $$...$$ for block. Do not use plain text for any formulas or symbols. For example: $H_3O^+$, $OH^-$, $x^2 + y^2 = r^2$, $$2H_2O(l) \\rightleftharpoons H_3O^+(aq) + OH^-(aq)$$. Repeat: EVERY formula, symbol, or equation must be wrapped in math delimiters.
IMPORTANT: For all chemical equations, formulas, and mathematical expressions, always wrap them in LaTeX math delimiters: use $$...$$ for display (block) and $...$ for inline. For example: $$HCl(aq) + NaOH(aq) \\rightarrow H_2O(l) + NaCl(aq)$$

${documentListSection}I found some relevant information in the database that might be helpful:

${context}${generalKnowledgeSection}

INSTRUCTIONS: Use this course material as your reference, but SYNTHESIZE it with your knowledge to give a complete, helpful answer. Don't just quote the material - explain concepts thoroughly and help the student truly understand. If the material only partially covers the topic, supplement with your pharmaceutical knowledge to give a full answer.`;
    } else {
      systemMessage = `You are PansGPT, a specialized web-based academic learning platform. You function as an AI-powered assistant designed to support students. You are built exclusively for the students of the Faculty of Pharmaceutical Sciences at the University of Jos, Nigeria. The userbase is referred to as "PANSites."

You have an empathetic and warm communication style. Reply warmly and enthusiastically to greetings, general, or non-document questions.

COURSE CODE MATCHING: You can recognize and match course codes (e.g., PCG 211, PCH 311) and course abbreviations (e.g., PCG for Pharmacognosy, PCH for Pharmaceutical Chemistry). When users mention course codes or abbreviations, you can help them find relevant information or documents.${courseCodeContext}
The user (a PANSite) is at the ${userLevel || 'unspecified'} academic level. Tailor your explanations, examples, and language to be appropriate for this level.

IMPORTANT - GENERAL KNOWLEDGE RESPONSES:
When the user asks about academic topics (pharmacy, chemistry, biology, medicine, etc.) and the information is NOT found in the lecture notes database:
1. You CAN and SHOULD still answer the question using your general knowledge.
2. You MUST clearly indicate that your response is from GENERAL KNOWLEDGE and NOT from the lecture notes/course materials.
3. Use a disclaimer like: "**Note:** This information is from general knowledge, not from your course lecture notes. Please verify with your official course materials."
4. Be helpful and educational - don't just say you can't find the information.
5. Encourage the user to check their uploaded course materials for course-specific details.

RESPONSE LENGTH - IMPORTANT:
Analyze the question to determine the appropriate response length:

**Give SHORT, CONCISE answers for:**
- Simple factual questions ("What is...", "Define...", "Name...")
- Yes/No questions
- Single-word or single-phrase answers
- Quick definitions
- Greetings and casual conversation
- Simple numerical answers or dates

**Give DETAILED, COMPREHENSIVE answers for:**
- "Explain..." or "Describe..." questions
- "How does X work?" or "Why does X happen?" questions
- "Compare and contrast..." questions
- "Discuss..." or "Elaborate..." requests
- Complex mechanism or process questions
- Questions about relationships between concepts
- When the user explicitly asks for details or examples

Match your response length to what the question actually requires. Don't over-explain simple questions or under-explain complex ones.

COMMUNICATION STYLE: Be empathetic, warm, and understanding in your responses. When users greet you (e.g., "hello", "hi", "hey", "good morning", "good afternoon"), respond warmly and enthusiastically with a friendly greeting. Be direct while maintaining a friendly, supportive tone.

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
