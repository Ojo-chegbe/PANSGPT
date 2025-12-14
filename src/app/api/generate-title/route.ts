import { NextResponse } from 'next/server';
import { generateConversationTitleFromAIResponse } from '@/lib/conversation-title-generator';

const GOOGLE_API_KEY = process.env.GOOGLE_AI_API_KEY!;

export async function POST(req: Request) {
  let aiResponse: string = '';
  
  try {
    const body = await req.json();
    aiResponse = body.aiResponse || '';

    if (!aiResponse || typeof aiResponse !== 'string') {
      return NextResponse.json(
        { error: 'AI response is required' },
        { status: 400 }
      );
    }

    if (!GOOGLE_API_KEY) {
      console.error('Google AI API key is not configured');
      // Fallback to simple title generation
      const { generateConversationTitle } = await import('@/lib/conversation-title-generator');
      const fallbackTitle = generateConversationTitle(aiResponse);
      return NextResponse.json({ title: fallbackTitle });
    }

    const title = await generateConversationTitleFromAIResponse(aiResponse, GOOGLE_API_KEY);

    return NextResponse.json({ title });
  } catch (error) {
    console.error('Error generating conversation title:', error);
    // Fallback to simple title generation on error
    const { generateConversationTitle } = await import('@/lib/conversation-title-generator');
    const fallbackTitle = generateConversationTitle(aiResponse || '');
    return NextResponse.json({ title: fallbackTitle });
  }
}

