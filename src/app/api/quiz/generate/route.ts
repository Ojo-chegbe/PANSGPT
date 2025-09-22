import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateChatResponse, ChatMessage } from "@/lib/google-ai";
import { jsonrepair } from 'jsonrepair';
import { createDiversityFirstPrompt, createDiversityFirstPromptWithSourceCount, createAggressiveDiversityPrompt, createRandomIndexDiversityPrompt, generateDiverseQuestionProfiles, DiversityPromptConfig } from "@/lib/diversity-first-prompts";

// Helper function to create a simplified prompt for retry attempts
function createSimplifiedPrompt(config: DiversityPromptConfig, context: string): string {
  const { courseCode, courseTitle, topic, level, numQuestions, questionType, difficulty } = config;
  
  return `You are an expert exam setter for ${courseCode} - ${courseTitle} at ${level} level.

Using the following course material, generate ${numQuestions} questions of type ${questionType}. The difficulty level should be ${difficulty}.

COURSE MATERIAL:
${context}

REQUIREMENTS:
1. Generate exactly ${numQuestions} questions
2. Each question should test understanding of the material
3. Include brief explanations for correct answers
4. Questions should be relevant to the provided material
5. Vary your questions - don't ask about the same concept multiple times

${getQuestionTypeInstructions(questionType)}

RESPONSE FORMAT (JSON):
{
  "questions": [
    {
      "questionText": "...",
      "questionType": "${questionType}",
      "options": ["...", ...],
      "correctAnswer": "...",
      "correctAnswers": ["...", ...],
      "explanation": "...",
      "points": 1
    }
  ]
}

Return ONLY valid JSON, no extra text.`;
}

function getQuestionTypeInstructions(questionType: string): string {
  switch (questionType) {
    case 'MCQ':
      return `MULTIPLE CHOICE QUESTIONS:
- Generate exactly 5 options per question
- 3 options must be TRUE (correct answers)
- 2 options must be FALSE but plausible
- Use clear, concise language
- Make false options believable but incorrect`;
    case 'OBJECTIVE':
      return `OBJECTIVE QUESTIONS:
- Generate exactly 4 options per question
- 1 correct answer, 3 plausible distractors
- Use clear, concise language
- Make distractors believable but incorrect`;
    case 'TRUE_FALSE':
      return `TRUE/FALSE QUESTIONS:
- Provide clear, unambiguous statements
- Avoid absolute terms when possible
- Make statements specific and testable`;
    case 'SHORT_ANSWER':
      return `SHORT ANSWER QUESTIONS:
- Ask for specific, concise responses
- Provide clear answer expectations
- Test understanding, not just memorization`;
    default:
      return '';
  }
}

// Helper function for lenient validation
function validateQuestionsLeniently(questions: GeneratedQuestion[], questionType: string): GeneratedQuestion[] {
  return questions.filter(q => {
    // Basic validation - must have question text
    if (!q.questionText || q.questionText.trim().length < 10) return false;
    
    // Type-specific validation (more lenient)
    if (questionType === 'MCQ') {
      if (!q.options || q.options.length < 3) return false; // Accept 3+ options instead of exactly 5
      if (!q.correctAnswers || q.correctAnswers.length < 1) return false; // Accept 1+ correct answers
      
      // Clean up options
      q.options = q.options.map(option => 
        option.replace(/\s*\(TRUE\)\s*$/i, '').replace(/\s*\(FALSE\)\s*$/i, '').trim()
      );
      
      // Clean up correct answers
      q.correctAnswers = q.correctAnswers.map(answer => 
        answer.replace(/\s*\(TRUE\)\s*$/i, '').replace(/\s*\(FALSE\)\s*$/i, '').trim()
      );
      
      q.questionType = 'MCQ';
      return true;
    }
    
    if (questionType === 'OBJECTIVE') {
      if (!q.options || q.options.length < 2) return false; // Accept 2+ options instead of exactly 4
      if (!q.correctAnswer) return false;
      
      // Clean up options
      q.options = q.options.map(option => 
        option.replace(/\s*\(TRUE\)\s*$/i, '').replace(/\s*\(FALSE\)\s*$/i, '').trim()
      );
      
      // Clean up correct answer
      q.correctAnswer = q.correctAnswer.replace(/\s*\(TRUE\)\s*$/i, '').replace(/\s*\(FALSE\)\s*$/i, '').trim();
      
      q.questionType = 'OBJECTIVE';
      return true;
    }
    
    if (questionType === 'TRUE_FALSE') {
      if (!q.correctAnswer || !['true', 'false'].includes(q.correctAnswer.toLowerCase())) return false;
      q.questionType = 'TRUE_FALSE';
      return true;
    }
    
    if (questionType === 'SHORT_ANSWER') {
      q.questionType = 'SHORT_ANSWER';
      return true;
    }
    
    return true; // Accept other types
  });
}

const GOOGLE_API_KEY = process.env.GOOGLE_AI_API_KEY!;

interface QuizGenerationRequest {
  courseCode: string;
  courseTitle: string;
  topic?: string;
  level: string;
  numQuestions: number;
  questionType: 'MCQ' | 'TRUE_FALSE' | 'OBJECTIVE' | 'SHORT_ANSWER';
  difficulty?: 'easy' | 'medium' | 'hard';
  timeLimit?: number;
}

interface GeneratedQuestion {
  questionText: string;
  questionType: string;
  options?: string[];
  correctAnswer: string;
  correctAnswers?: string[];
  explanation: string;
  points: number;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      courseCode,
      courseTitle,
      topic,
      level,
      numQuestions,
      questionType,
      difficulty = 'medium',
      timeLimit
    }: QuizGenerationRequest = await req.json();

    if (!courseCode || !courseTitle || !level || !numQuestions) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Search for relevant document chunks
    const searchQuery = topic 
      ? `${courseCode} ${courseTitle} ${topic}`
      : `${courseCode} ${courseTitle}`;

    // Get diverse context for quiz generation - 2 queries with 20 results each = 40 chunks
    const maxChunks = 40;
    const searchResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/quiz-search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        query: searchQuery,
        filters: {
          courseCode,
          level,
          topic,
          max_chunks: maxChunks,
          diversity_lambda: 0.8 // Higher diversity for source material
        }
      }),
    });

    let context = "";
    let selectedIndices: number[] = [];

    if (searchResponse.ok) {
      const { chunks } = await searchResponse.json();
      if (chunks && chunks.length > 0) {
        // Create diverse context from chunks - RANDOMLY select for maximum diversity
        // Cast a wider net to get more chunks for true diversity
        const contextSize = topic ? 40 : 30;
        
        // Pure random selection by database index - completely randomize chunk selection
        const selectedChunks: any[] = [];
        const totalChunks = chunks.length;
        
        // Create array of all possible indices
        const allIndices = Array.from({ length: totalChunks }, (_, i) => i);
        
        // Shuffle the indices using Fisher-Yates algorithm
        for (let i = allIndices.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [allIndices[i], allIndices[j]] = [allIndices[j], allIndices[i]];
        }
        
        // Take the first contextSize indices (now randomized)
        selectedIndices = allIndices.slice(0, contextSize);
    
    // Get chunks by the randomized indices
    selectedIndices.forEach(index => {
      selectedChunks.push(chunks[index]);
    });
        
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        console.log(`📚 [${timestamp}] Pure random selection: ${selectedChunks.length} chunks from ${totalChunks} available`);
        console.log(`   - Selected indices: [${selectedIndices.join(', ')}]`);
        console.log(`   - Randomization: Fisher-Yates shuffle applied to all ${totalChunks} chunks`);
        
        // Log source information for debugging
        selectedChunks.forEach((chunk: any, index: number) => {
          const source = chunk.metadata?.source || `Source ${index + 1}`;
          const content = chunk.content || chunk.chunk_text;
          const similarity = chunk.similarity || 'N/A';
          console.log(`📖 Random Source ${index + 1}: ${source} (${content.length} chars, similarity: ${similarity})`);
        });
        
        // Create context that emphasizes diversity of sources
        context = `DIVERSE COURSE MATERIAL SOURCES:\n\n` +
          selectedChunks
            .map((chunk: any, index: number) => {
              const content = chunk.content || chunk.chunk_text;
              const source = chunk.metadata?.source || `Source ${index + 1}`;
              return `--- SOURCE ${index + 1}: ${source} ---\n${content}`;
            })
            .join('\n\n--- END SOURCE ---\n\n');
            
        console.log(`📝 Context created with ${selectedChunks.length} distinct sources (${context.length} total chars)`);
        
        // Update the prompt to use the actual number of sources available
        const actualSourceCount = selectedChunks.length;
      }
    }

    if (!context) {
      return NextResponse.json(
        { error: "No relevant content found for this course/topic. Please ensure documents are uploaded for this course." },
        { status: 404 }
      );
    }

    // Create prompt configuration
    const promptConfig: DiversityPromptConfig = {
      courseCode,
      courseTitle,
      topic,
      level,
      numQuestions,
      questionType,
      difficulty,
      timeLimit
    };
    
    // Use random index diversity prompt to force different sources
    let diversityPrompt: string;
    try {
      const actualSourceCount = context.split('--- SOURCE').length - 1;
      console.log(`🎯 Using random index diversity prompt with ${actualSourceCount} sources for ${numQuestions} questions`);
      console.log(`📊 Selected database indices: [${selectedIndices.join(', ')}]`);
      
      // If we have selected indices, use the random index prompt, otherwise fall back to aggressive
      if (selectedIndices.length > 0) {
        diversityPrompt = createRandomIndexDiversityPrompt(promptConfig, context, selectedIndices);
      } else {
        console.log('No selected indices available, using aggressive diversity prompt');
        diversityPrompt = createAggressiveDiversityPrompt(promptConfig, context, actualSourceCount);
      }
    } catch (error) {
      console.log('Falling back to simple prompt generation');
      diversityPrompt = createSimplifiedPrompt(promptConfig, context);
    }
    
    // Generate questions with retry logic and fallback
    let allGeneratedQuestions: GeneratedQuestion[] = [];
    const MAX_ATTEMPTS = 3;
    let attempt = 0;
    
    while (allGeneratedQuestions.length < numQuestions && attempt < MAX_ATTEMPTS) {
      attempt++;
      
      // Use simpler prompt for retry attempts
      const promptToUse = attempt === 1 ? diversityPrompt : createSimplifiedPrompt(promptConfig, context);

      const messagesForAI: ChatMessage[] = [
        { role: "system", content: promptToUse },
        { role: "user", content: `Generate ${numQuestions} questions based on the material. Attempt ${attempt}.` }
      ];
      
      const aiResponse = await generateChatResponse(GOOGLE_API_KEY, messagesForAI, {
        maxOutputTokens: 4096,
        temperature: 0.8 + (attempt * 0.1), // Increase temperature with each attempt
        topK: 40,
        topP: 0.95,
      });
      
      let batchQuestions: GeneratedQuestion[] = [];
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          let parsed;
          try {
            parsed = JSON.parse(jsonMatch[0]);
          } catch (e) {
            parsed = JSON.parse(jsonrepair(jsonMatch[0]));
          }
          batchQuestions = parsed.questions || [];
        }
      } catch (error) {
        console.error(`Error parsing AI response on attempt ${attempt}:`, error);
      }
      
      // More lenient validation - accept questions even if they don't meet all criteria
      const validatedQuestions = validateQuestionsLeniently(batchQuestions, questionType);
      allGeneratedQuestions = [...allGeneratedQuestions, ...validatedQuestions];
      
      // Remove duplicates
      allGeneratedQuestions = allGeneratedQuestions.filter((question, index, self) => 
        index === self.findIndex(q => q.questionText === question.questionText)
      );
      
      // Check source diversity and reject if not diverse enough
      const sourcesUsed = validatedQuestions.map(q => (q as any).sourceUsed).filter(Boolean);
      const uniqueSources = [...new Set(sourcesUsed)];
      const diversityRatio = uniqueSources.length / validatedQuestions.length;
      
      console.log(`Attempt ${attempt}: Generated ${validatedQuestions.length} questions, Total: ${allGeneratedQuestions.length}`);
      console.log(`📊 Sources used: ${uniqueSources.length} unique sources (${sourcesUsed.join(', ')})`);
      console.log(`📈 Source diversity ratio: ${(diversityRatio * 100).toFixed(1)}%`);
      
      // If diversity is too low, reject this batch and try again
      if (validatedQuestions.length > 1 && diversityRatio < 0.9) {
        console.log(`❌ Low source diversity (${(diversityRatio * 100).toFixed(1)}%), rejecting batch and retrying...`);
        continue; // Skip this batch and try again
      }
      
      // If we have questions but they're all from the same source, reject
      if (validatedQuestions.length > 1 && uniqueSources.length === 1) {
        console.log(`❌ All questions from same source (${uniqueSources[0]}), rejecting batch and retrying...`);
        continue; // Skip this batch and try again
      }
    }
    
    // Take what we have, even if less than requested
    const generatedQuestions = allGeneratedQuestions.slice(0, numQuestions);
    
    // Final diversity check
    const finalSourcesUsed = generatedQuestions.map(q => (q as any).sourceUsed).filter(Boolean);
    const finalUniqueSources = [...new Set(finalSourcesUsed)];
    const finalDiversityRatio = finalUniqueSources.length / generatedQuestions.length;
    
    console.log(`🎯 Final quiz diversity: ${finalUniqueSources.length} unique sources out of ${generatedQuestions.length} questions (${(finalDiversityRatio * 100).toFixed(1)}%)`);
    console.log(`📊 Final sources used: ${finalUniqueSources.join(', ')}`);
    
    // If we have at least some questions, proceed; otherwise return error
    if (generatedQuestions.length === 0) {
        return NextResponse.json({
        error: `Could not generate any valid questions. Please try with a different topic or course.`
      }, { status: 500 });
    }

    // Get user ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Parse timeLimit to number or null
    const parsedTimeLimit = timeLimit ? Number(timeLimit) : null;

    // Create quiz in database
    const quiz = await (prisma as any).quiz.create({
      data: {
        title: `${courseCode} - ${topic || 'General'} Quiz`,
        courseCode,
        courseTitle,
        topic,
        level,
        difficulty,
        numQuestions: generatedQuestions.length,
        timeLimit: parsedTimeLimit,
        userId: user.id,
        questions: {
          create: generatedQuestions.map((q, index) => ({
            questionText: q.questionText,
            questionType: q.questionType,
            options: q.options ? q.options : null,
            correctAnswer:
              q.questionType === 'MCQ'
                ? JSON.stringify(q.correctAnswers || [])
                : q.correctAnswer || '',
            explanation: q.explanation,
            points: q.points,
            order: index + 1
          }))
        }
      },
      include: {
        questions: {
          orderBy: { order: 'asc' }
        }
      }
    });

    // Prepare response
    const response: any = {
      success: true,
      quiz: {
        id: quiz.id,
        title: quiz.title,
        courseCode: quiz.courseCode,
        courseTitle: quiz.courseTitle,
        topic: quiz.topic,
        level: quiz.level,
        difficulty: quiz.difficulty,
        numQuestions: quiz.numQuestions,
        timeLimit: quiz.timeLimit,
        questions: quiz.questions.map((q: any) => ({
          id: q.id,
          questionText: q.questionText,
          questionType: q.questionType,
          options: q.options,
          order: q.order
        }))
      }
    };

    // Add message if we generated fewer questions than requested
    if (generatedQuestions.length < numQuestions) {
      response.message = `Generated ${generatedQuestions.length} out of ${numQuestions} requested questions. The system prioritized quality over quantity.`;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error("Quiz generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate quiz" },
      { status: 500 }
    );
  }
} 