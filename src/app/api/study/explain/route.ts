import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

// Explain types
type ExplainType = 'explain' | 'example' | 'define' | 'quiz' | 'remember';

// System prompts for different explain types - each mode has a distinct purpose
const SYSTEM_PROMPTS: Record<ExplainType, string> = {
    explain: `You are a helpful pharmacy tutor. The student has highlighted text they don't understand and needs a CLEAR EXPLANATION.

YOUR GOAL: Help them UNDERSTAND the concept - what it means and why it matters.

Instructions:
- Break down the concept into simple, digestible parts
- Explain the "what" and "why" behind the concept
- Use simple language a student can understand
- Connect it to what they already know about pharmacy
- DO NOT provide examples, mnemonics, or memory tricks - just explain the concept clearly
- Keep it focused: 2-3 short paragraphs maximum`,

    example: `You are a helpful pharmacy tutor. The student has highlighted a concept and wants to see it IN ACTION through a real-world example.

YOUR GOAL: Show them HOW this concept applies in real pharmacy/clinical practice.

Instructions:
- Provide a specific, realistic scenario (patient case, pharmacy situation, clinical decision)
- Walk through how the highlighted concept applies in that scenario
- Make it practical and relatable to pharmacy work
- DO NOT explain the concept itself - assume they understand it and just want to see it applied
- DO NOT provide memory aids or mnemonics
- One clear, detailed example is better than multiple brief ones`,

    define: `You are a helpful pharmacy tutor. The student wants a PRECISE DEFINITION.

YOUR GOAL: Give a clear, textbook-style definition.

Instructions:
- Provide a concise, accurate definition
- Include pronunciation guide if it's a drug name or medical term
- List 1-2 key facts or characteristics
- Keep it brief and reference-style
- DO NOT explain in depth or provide examples`,

    quiz: `You are a helpful pharmacy tutor. Create a quiz question to TEST their understanding of the highlighted concept.

YOUR GOAL: Help them self-assess their knowledge.

Format your response exactly as:
**Question:** [Your question]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]

**Correct Answer:** [Letter]
**Explanation:** [Brief explanation of why this is correct]`,

    remember: `You are a helpful pharmacy tutor. The student wants a MEMORY AID to help them RETAIN the highlighted information for exams.

YOUR GOAL: Create creative memory techniques that make the content stick in their mind.

Instructions:
- Cover EVERYTHING in the highlighted text - don't skip any part
- Use one or more of these techniques:
  * Mnemonics (first letter of each word forms a memorable word/phrase)
  * Acronyms that spell something memorable
  * Rhymes or catchy phrases
  * Visual imagery (describe a mental picture they can recall)
  * Analogies to everyday things they already know
  * Stories that connect the concepts together
- Make it fun, creative, and memorable
- If it's a drug name, include pronunciation tricks
- DO NOT explain the concept - assume they understand it and just need help memorizing it
- DO NOT give examples of clinical application`,
};

/**
 * POST /api/study/explain
 * AI-powered explanation for highlighted text in Study Mode
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            selectedText,
            documentId,
            sectionTitle,
            context,
            explainType = 'explain',
            conversationHistory = []
        } = body;

        if (!selectedText) {
            return NextResponse.json(
                { error: 'No text selected' },
                { status: 400 }
            );
        }

        // Validate explain type
        if (!['explain', 'example', 'define', 'quiz', 'remember'].includes(explainType)) {
            return NextResponse.json(
                { error: 'Invalid explain type' },
                { status: 400 }
            );
        }

        // Fetch document info for context
        let documentInfo = '';
        if (documentId) {
            const doc = await prisma.document.findUnique({
                where: { id: documentId },
                select: {
                    title: true,
                    courseCode: true,
                    courseTitle: true,
                    professorName: true,
                    topic: true,
                },
            });

            if (doc) {
                documentInfo = `
Course: ${doc.courseCode} - ${doc.courseTitle}
Topic: ${doc.topic || 'General'}
Document: ${doc.title}
Lecturer: ${doc.professorName}`;
            }
        }

        // Build conversation history for context
        let historyContext = '';
        if (conversationHistory && conversationHistory.length > 0) {
            // Take last 6 messages for context (3 exchanges)
            const recentHistory = conversationHistory.slice(-6);
            historyContext = '\n\nPrevious conversation:\n' + recentHistory.map((msg: { role: string; content: string }) =>
                `${msg.role === 'user' ? 'Student' : 'Tutor'}: ${msg.content}`
            ).join('\n');
        }

        // Check if this is a follow-up confirmation response (like "yes", "I understand", etc.)
        const confirmationPatterns = /^(yes|yeah|yep|yup|ok|okay|got it|i understand|i get it|makes sense|thanks|thank you|understood|clear|uh.?huh|sure)$/i;
        const isConfirmation = confirmationPatterns.test(selectedText.trim());

        // Build the prompt
        const systemPrompt = SYSTEM_PROMPTS[explainType as ExplainType];

        // Build user prompt based on whether this is a follow-up or new request
        let userPrompt;
        if (isConfirmation && conversationHistory.length > 0) {
            userPrompt = `
${documentInfo}
${historyContext}

The student just responded: "${selectedText}"

This appears to be a confirmation that they understand. Please:
1. Acknowledge their understanding positively
2. Ask if they have any follow-up questions
3. Keep your response brief and encouraging`;
        } else {
            userPrompt = `
${documentInfo}

${sectionTitle ? `Current Section: ${sectionTitle}` : ''}

${context ? `Surrounding Context: "${context}"` : ''}
${historyContext}

Highlighted Text: "${selectedText}"

Please ${explainType === 'quiz' ? 'create a quiz question about' : explainType} this.`;
        }

        // Generate response using Gemini
        const model = genAI.getGenerativeModel({ model: 'gemma-3-27b-it' });

        const result = await model.generateContent({
            contents: [
                {
                    role: 'user',
                    parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
                },
            ],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1024,
            },
        });

        const response = result.response;
        const text = response.text();

        return NextResponse.json({
            explanation: text,
            type: explainType,
            selectedText,
        });
    } catch (error) {
        console.error('Error generating explanation:', error);
        return NextResponse.json(
            { error: 'Failed to generate explanation' },
            { status: 500 }
        );
    }
}
