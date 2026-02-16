import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Simple token validation
function isValidToken(authHeader: string | null): boolean {
    if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
    const token = authHeader.substring(7);
    return token.length > 0;
}

// PATCH - Toggle restriction active status
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authHeader = req.headers.get('authorization');

        if (!isValidToken(authHeader)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { isActive } = body;

        const restriction = await prisma.accessRestriction.update({
            where: { id },
            data: { isActive },
        });

        return NextResponse.json(restriction);
    } catch (error) {
        console.error('Error updating restriction:', error);
        return NextResponse.json({ error: 'Failed to update restriction' }, { status: 500 });
    }
}

// DELETE - Delete restriction
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authHeader = req.headers.get('authorization');

        if (!isValidToken(authHeader)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        await prisma.accessRestriction.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting restriction:', error);
        return NextResponse.json({ error: 'Failed to delete restriction' }, { status: 500 });
    }
}
