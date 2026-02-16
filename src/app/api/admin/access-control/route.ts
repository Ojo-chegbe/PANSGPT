import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Simple token validation (checks if authorization header is present)
function isValidToken(authHeader: string | null): boolean {
    if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
    const token = authHeader.substring(7);
    return token.length > 0;
}

// GET - List all access restrictions
export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get('authorization');

        if (!isValidToken(authHeader)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const restrictions = await prisma.accessRestriction.findMany({
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(restrictions);
    } catch (error) {
        console.error('Error fetching restrictions:', error);
        return NextResponse.json({ error: 'Failed to fetch restrictions' }, { status: 500 });
    }
}

// POST - Create new restriction
export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get('authorization');

        if (!isValidToken(authHeader)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { levels, reason, startTime, endTime } = body;

        // Validation
        if (!levels || !Array.isArray(levels) || levels.length === 0) {
            return NextResponse.json({ error: 'At least one level is required' }, { status: 400 });
        }

        if (!reason || typeof reason !== 'string') {
            return NextResponse.json({ error: 'Reason is required' }, { status: 400 });
        }

        if (!startTime || !endTime) {
            return NextResponse.json({ error: 'Start and end times are required' }, { status: 400 });
        }

        const start = new Date(startTime);
        const end = new Date(endTime);

        if (end <= start) {
            return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 });
        }

        const restriction = await prisma.accessRestriction.create({
            data: {
                levels,
                reason,
                startTime: start,
                endTime: end,
                createdBy: 'admin',
                isActive: true,
            },
        });

        return NextResponse.json(restriction, { status: 201 });
    } catch (error) {
        console.error('Error creating restriction:', error);
        return NextResponse.json({ error: 'Failed to create restriction' }, { status: 500 });
    }
}
