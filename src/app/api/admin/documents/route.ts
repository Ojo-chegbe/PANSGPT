import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/documents
 * Fetches ALL documents without level filtering for admin view
 */
export async function GET() {
    try {
        const documents = await prisma.document.findMany({
            select: {
                id: true,
                title: true,
                fileName: true,
                courseCode: true,
                courseTitle: true,
                professorName: true,
                topic: true,
                level: true,
                createdAt: true,
                documentType: true,
            },
            orderBy: [
                { level: 'asc' },
                { courseCode: 'asc' },
                { createdAt: 'desc' }
            ],
        });

        return NextResponse.json({ documents });
    } catch (err) {
        console.error("Failed to fetch documents:", err);
        return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
    }
}
