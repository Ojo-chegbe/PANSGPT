import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    // Check if document with same filename exists for this user
    const existingDocument = await prisma.document.findFirst({
      where: {
        fileName: filename,
        uploadedBy: session.user.id
      },
      select: {
        id: true,
        title: true,
        uploadedAt: true
      }
    });

    return NextResponse.json({
      exists: !!existingDocument,
      document: existingDocument
    });

  } catch (error) {
    console.error('Check duplicate error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
