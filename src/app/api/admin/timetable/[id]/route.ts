import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const timetableId = params.id;
    if (!timetableId) {
      return NextResponse.json({ error: 'Timetable ID is required' }, { status: 400 });
    }

    // Check if timetable entry exists
    const existingEntry = await prisma.timetable.findUnique({
      where: { id: timetableId }
    });

    if (!existingEntry) {
      return NextResponse.json({ error: 'Timetable entry not found' }, { status: 404 });
    }

    // Delete the timetable entry
    await prisma.timetable.delete({
      where: { id: timetableId }
    });

    return NextResponse.json({ 
      success: true,
      message: `Timetable entry deleted successfully`
    });
  } catch (err) {
    console.error("Failed to delete timetable entry:", err);
    return NextResponse.json({ 
      error: "Failed to delete timetable entry" 
    }, { status: 500 });
  }
}
