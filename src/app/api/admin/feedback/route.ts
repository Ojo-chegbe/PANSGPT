import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const rating = searchParams.get('rating'); // Filter by rating: thumbs_up, thumbs_down, popup_feedback
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = {};
    if (rating) {
      where.rating = rating;
    }

    // Fetch feedback with user information
    const [feedbacks, total] = await Promise.all([
      prisma.messageFeedback.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              level: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      prisma.messageFeedback.count({ where }),
    ]);

    // Get summary statistics
    const stats = await prisma.messageFeedback.groupBy({
      by: ['rating'],
      _count: {
        rating: true,
      },
    });

    const summary = {
      thumbs_up: 0,
      thumbs_down: 0,
      popup_feedback: 0,
      total: total,
    };

    stats.forEach((stat) => {
      if (stat.rating === 'thumbs_up') summary.thumbs_up = stat._count.rating;
      if (stat.rating === 'thumbs_down') summary.thumbs_down = stat._count.rating;
      if (stat.rating === 'popup_feedback') summary.popup_feedback = stat._count.rating;
    });

    return NextResponse.json({
      feedbacks,
      summary,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
}

