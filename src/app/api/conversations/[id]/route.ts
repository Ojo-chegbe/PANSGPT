import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/conversations/[id] - Rename conversation
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const conversationId = params.id;
    if (!conversationId) {
      return NextResponse.json({ error: "Conversation ID is required" }, { status: 400 });
    }

    const data = await request.json();
    const { title } = data;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Verify the conversation belongs to the user
    const existingConversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { userId: true, title: true }
    });

    if (!existingConversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    if (existingConversation.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update only the title
    const updatedConversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        title: title.trim(),
        updatedAt: new Date()
      },
      select: {
        id: true,
        title: true,
        updatedAt: true
      }
    });

    console.log('Conversation renamed successfully:', {
      conversationId: updatedConversation.id,
      oldTitle: existingConversation.title,
      newTitle: updatedConversation.title,
      userId: user.id
    });

    return NextResponse.json({ 
      success: true,
      conversation: updatedConversation
    });

  } catch (error) {
    console.error("Error renaming conversation:", error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}

// GET /api/conversations/[id] - Get specific conversation
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const conversationId = params.id;
    if (!conversationId) {
      return NextResponse.json({ error: "Conversation ID is required" }, { status: 400 });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" }
        }
      }
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    if (conversation.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ conversation });

  } catch (error) {
    console.error("Error fetching conversation:", error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}

// DELETE /api/conversations/[id] - Delete specific conversation
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const conversationId = params.id;
    if (!conversationId) {
      return NextResponse.json({ error: "Conversation ID is required" }, { status: 400 });
    }

    // Verify the conversation belongs to the user
    const existingConversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { userId: true, title: true }
    });

    if (!existingConversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    if (existingConversation.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.conversation.delete({
      where: { id: conversationId }
    });

    console.log('Conversation deleted successfully:', {
      conversationId,
      title: existingConversation.title,
      userId: user.id
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error deleting conversation:", error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}
