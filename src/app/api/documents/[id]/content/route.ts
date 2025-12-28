import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseDocumentContent, StructuredDocument } from '@/lib/parse-document';

/**
 * GET /api/documents/[id]/content
 * Fetches document with structured content for Study Mode
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Fetch the document
        const document = await prisma.document.findUnique({
            where: { id },
            select: {
                id: true,
                title: true,
                fileName: true,
                courseCode: true,
                courseTitle: true,
                professorName: true,
                topic: true,
                level: true,
                content: true,
                structuredContent: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!document) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        // Check if user's level matches document level (if level-restricted)
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { level: true },
        });

        if (document.level && user?.level && document.level !== user.level) {
            return NextResponse.json(
                { error: 'This document is not available for your level' },
                { status: 403 }
            );
        }

        // If structured content doesn't exist, generate it lazily
        let structuredContent = document.structuredContent as StructuredDocument | null;

        if (!structuredContent && document.content) {
            console.log(`Lazy parsing document ${id} for Study Mode...`);
            structuredContent = parseDocumentContent(document.content);

            // Save the parsed content for future requests
            await prisma.document.update({
                where: { id },
                data: { structuredContent: structuredContent as any },
            });

            console.log(`Parsed and saved: ${structuredContent.totalSections} sections, ${structuredContent.totalParagraphs} paragraphs`);
        }

        // Get previous and next documents for navigation
        const [prevDocument, nextDocument] = await Promise.all([
            prisma.document.findFirst({
                where: {
                    courseCode: document.courseCode,
                    level: document.level,
                    createdAt: { lt: document.createdAt },
                },
                orderBy: { createdAt: 'desc' },
                select: { id: true, title: true },
            }),
            prisma.document.findFirst({
                where: {
                    courseCode: document.courseCode,
                    level: document.level,
                    createdAt: { gt: document.createdAt },
                },
                orderBy: { createdAt: 'asc' },
                select: { id: true, title: true },
            }),
        ]);

        return NextResponse.json({
            document: {
                id: document.id,
                title: document.title,
                fileName: document.fileName,
                courseCode: document.courseCode,
                courseTitle: document.courseTitle,
                professorName: document.professorName,
                topic: document.topic,
                level: document.level,
            },
            structuredContent,
            navigation: {
                prev: prevDocument,
                next: nextDocument,
            },
        });
    } catch (error) {
        console.error('Error fetching document content:', error);
        return NextResponse.json(
            { error: 'Failed to fetch document content' },
            { status: 500 }
        );
    }
}
