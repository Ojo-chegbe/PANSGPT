import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messageId, rating, feedback, messageContent, userPrompt } = await request.json();

    if (!rating) {
      return NextResponse.json({ error: 'Rating is required' }, { status: 400 });
    }

    // Validate rating
    const validRatings = ['thumbs_up', 'thumbs_down', 'popup_feedback'];
    if (!validRatings.includes(rating)) {
      return NextResponse.json({ error: 'Invalid rating' }, { status: 400 });
    }

    // Store feedback in database
    const messageFeedback = await prisma.messageFeedback.create({
      data: {
        userId: session.user.id,
        messageId: messageId || null,
        rating,
        feedback: feedback || null,
        messageContent: messageContent || null, // Store full message content
        userPrompt: userPrompt || null, // Store user prompt
      },
    });

    return NextResponse.json({
      success: true,
      feedback: messageFeedback,
    });
  } catch (error) {
    console.error('Error saving message feedback:', error);
    return NextResponse.json(
      { error: 'Failed to save feedback' },
      { status: 500 }
    );
  }
}

