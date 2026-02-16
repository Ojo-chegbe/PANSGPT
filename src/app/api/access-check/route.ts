import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Check if current user is restricted
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            // No session = not restricted (they'll be redirected to login anyway)
            return NextResponse.json({ restricted: false });
        }

        // Get user's level from database
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { level: true },
        });

        if (!user?.level) {
            // No level set = not restricted
            return NextResponse.json({ restricted: false });
        }

        const userLevel = user.level;
        const now = new Date();

        // Find any active restriction that applies to this user's level
        const restriction = await prisma.accessRestriction.findFirst({
            where: {
                isActive: true,
                startTime: { lte: now },
                endTime: { gt: now },
                OR: [
                    { levels: { has: userLevel } },
                    { levels: { has: 'all' } },
                ],
            },
            orderBy: { endTime: 'asc' }, // Get the one ending soonest
        });

        if (restriction) {
            return NextResponse.json({
                restricted: true,
                reason: restriction.reason,
                resumesAt: restriction.endTime.toISOString(),
                levels: restriction.levels,
            });
        }

        return NextResponse.json({ restricted: false });
    } catch (error) {
        console.error('Error checking access restriction:', error);
        // On error, don't restrict (fail open for user experience)
        return NextResponse.json({ restricted: false });
    }
}
