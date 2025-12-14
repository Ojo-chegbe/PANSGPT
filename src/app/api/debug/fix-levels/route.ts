import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: Check and fix level values
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get current user's level
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { id: true, email: true, level: true }
        });

        // Get unique timetable levels
        const timetables = await prisma.timetable.findMany({
            select: { level: true },
            distinct: ['level']
        });

        const timetableLevels = timetables.map(t => t.level);

        let fixed = false;
        let originalLevel = user?.level;
        let newLevel = user?.level;

        // Check if user's level needs fixing
        if (user?.level && user.level.includes(' Level Level')) {
            newLevel = user.level.replace(' Level Level', ' Level');
            await prisma.user.update({
                where: { id: user.id },
                data: { level: newLevel }
            });
            fixed = true;
        }

        return NextResponse.json({
            user: {
                email: user?.email,
                originalLevel,
                currentLevel: newLevel,
                levelFixed: fixed
            },
            timetableLevels,
            levelMatch: timetableLevels.includes(newLevel || '')
        });
    } catch (error) {
        console.error('Failed to check levels:', error);
        return NextResponse.json(
            { error: 'Failed to check levels' },
            { status: 500 }
        );
    }
}

// POST: Set user level to a specific value
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { level } = await request.json();

        if (!level) {
            return NextResponse.json({ error: 'Level is required' }, { status: 400 });
        }

        const user = await prisma.user.update({
            where: { id: session.user.id },
            data: { level }
        });

        return NextResponse.json({
            success: true,
            level: user.level
        });
    } catch (error) {
        console.error('Failed to update level:', error);
        return NextResponse.json(
            { error: 'Failed to update level' },
            { status: 500 }
        );
    }
}
