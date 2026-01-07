import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

// Explain types
type ExplainType = 'explain' | 'example' | 'define' | 'quiz' | 'remember';

// System prompts for different explain types
const SYSTEM_PROMPTS: Record<ExplainType, string> = {
    explain: `You are a helpful pharmacy tutor. The student has highlighted some text they don't understand. 
Explain this concept in simple terms that a pharmacy student would understand.
- Use clear, simple language
- Break down complex terms
- Make connections to practical pharmacy applications
- Keep the explanation concise (2-4 paragraphs max)`,

    example: `You are a helpful pharmacy tutor. The student wants a practical example of the highlighted concept.
Provide a real-world or clinical example that illustrates this concept.
- Use a relevant pharmacy/clinical scenario
- Make it memorable and practical
- Keep it concise and focused`,

    define: `You are a helpful pharmacy tutor. The student wants a clear definition.
Provide a precise definition of the highlighted term or concept.
- Give a clear, concise definition
- Include pronunciation guide if it's a drug name
- Mention 1-2 key related facts`,

    quiz: `You are a helpful pharmacy tutor. Create a quick quiz question to test understanding of the highlighted concept.
Generate ONE multiple-choice question with 4 options.
Format your response as:
**Question:** [Your question]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]

**Correct Answer:** [Letter]
**Explanation:** [Brief explanation of why this is correct]`,

    remember: `You are a helpful pharmacy tutor. The student wants help remembering the highlighted concept.
Create a memorable memory aid to help them retain this information.
- Use mnemonics, acronyms, or catchy phrases when appropriate
- Create relatable analogies or stories
- Use visual imagery or associations
- Make it fun, creative, and easy to recall
- Keep it concise but memorable
- If it's a drug name or medical term, help with pronunciation tricks too`,
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
            explainType = 'explain'
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

        // Build the prompt
        const systemPrompt = SYSTEM_PROMPTS[explainType as ExplainType];
        const userPrompt = `
${documentInfo}

${sectionTitle ? `Current Section: ${sectionTitle}` : ''}

${context ? `Surrounding Context: "${context}"` : ''}

Highlighted Text: "${selectedText}"

Please ${explainType === 'quiz' ? 'create a quiz question about' : explainType} this.`;

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
