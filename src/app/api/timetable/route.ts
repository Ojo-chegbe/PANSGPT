import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Helper function to normalize level format
function normalizeLevelForMatching(level: string): string[] {
  // Extract the numeric part (e.g., "400" from "400 Level" or just "400")
  const match = level.match(/(\d+)/);
  if (!match) return [level];

  const numericLevel = match[1];
  // Return possible formats to match against
  return [
    level,                           // Original format (e.g., "400 Level")
    numericLevel,                   // Just the number (e.g., "400")
    `${numericLevel} Level`,       // With " Level" suffix
    `${numericLevel}L`,            // With "L" suffix
  ];
}

// GET: Fetch user's timetable based on their level
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's level from the database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { level: true }
    });

    if (!user?.level) {
      return NextResponse.json({ error: 'User level not set' }, { status: 400 });
    }

    // Get possible level formats to match
    const possibleLevels = normalizeLevelForMatching(user.level);

    // Fetch timetable for any matching level format
    const timetables = await prisma.timetable.findMany({
      where: {
        level: { in: possibleLevels }
      },
      orderBy: [
        { day: 'asc' },
        { timeSlot: 'asc' }
      ]
    });

    return NextResponse.json({
      level: user.level,
      timetables
    });
  } catch (error) {
    console.error('Failed to fetch user timetable:', error);
    return NextResponse.json(
      { error: 'Failed to fetch timetable' },
      { status: 500 }
    );
  }
}
