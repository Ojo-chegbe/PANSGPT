'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { ClipboardIcon, PencilIcon, PaperAirplaneIcon, HandThumbUpIcon, HandThumbDownIcon, StopIcon, XMarkIcon, ClockIcon, PlusIcon } from '@heroicons/react/24/outline';
import { HandThumbUpIcon as HandThumbUpIconSolid, HandThumbDownIcon as HandThumbDownIconSolid } from '@heroicons/react/24/solid';
import MarkdownWithMath from '@/components/MarkdownWithMath';

// Types
type MessageRole = 'user' | 'system' | 'model';

interface ExtendedChatMessage {
    role: MessageRole;
    content: string;
    hasContext?: boolean;
    createdAt?: string;
    citations?: Array<{ lecturerName: string; documentTitle: string }>;
    feedback?: 'thumbs_up' | 'thumbs_down' | null;
}

interface StudyConversation {
    id: string;
    title: string;
    updatedAt: string;
    messageCount: number;
}

interface ChatInterfaceProps {
    mode?: 'standalone' | 'embedded';
    onClose?: () => void;
    initialQuery?: string;
    pendingQuery?: string;  // New prop for explain functionality - triggers send when changed
    onQueryProcessed?: () => void;  // Callback when pending query is processed
    documentContext?: {
        documentId?: string;
        title?: string;
        sectionTitle?: string;
    };
    className?: string;
    showHistoryButton?: boolean;  // Show history icon for study mode
}

// Format author name for APA citation
function formatAuthorName(lecturerName: string): string {
    let formattedAuthor = lecturerName.trim();
    if (!formattedAuthor.includes(',')) {
        const nameParts = formattedAuthor.split(/\s+/);
        if (nameParts.length >= 2) {
            const lastName = nameParts[nameParts.length - 1];
            const firstNames = nameParts.slice(0, -1);
            const firstInitial = firstNames[0]?.charAt(0)?.toUpperCase() || '';
            formattedAuthor = `${lastName}, ${firstInitial}.`;
        }
    }
    return formattedAuthor;
}

export default function ChatInterface({
    mode = 'standalone',
    onClose,
    initialQuery,
    pendingQuery,
    onQueryProcessed,
    documentContext,
    className = '',
    showHistoryButton = false,
}: ChatInterfaceProps) {
    const { data: session } = useSession();
    const [messages, setMessages] = useState<ExtendedChatMessage[]>([]);
    const [input, setInput] = useState(initialQuery || '');
    const [isLoading, setIsLoading] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [editingIdx, setEditingIdx] = useState<number | null>(null);
    const [editingText, setEditingText] = useState('');
    const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
    const [showCitationsFor, setShowCitationsFor] = useState<number | null>(null);
    const lastProcessedQuery = useRef<string | null>(null);

    // Conversation persistence state for study mode
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [studyConversations, setStudyConversations] = useState<StudyConversation[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const messagesRef = useRef<ExtendedChatMessage[]>([]);
    const hasLoadedConversation = useRef(false);

    const chatEndRef = useRef<HTMLDivElement | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Auto-resize textarea
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            const newHeight = Math.min(Math.max(textarea.scrollHeight, 24), 200);
            textarea.style.height = `${newHeight}px`;
        }
    }, [input]);

    // Keep messagesRef in sync with messages
    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    // Load existing conversation for study mode on mount
    useEffect(() => {
        if (mode !== 'embedded' || !documentContext?.documentId || !session?.user?.id || hasLoadedConversation.current) return;

        const loadStudyConversations = async () => {
            try {
                hasLoadedConversation.current = true;
                const docTitle = documentContext.title || 'Study Session';
                const titlePattern = `Study: ${docTitle}`;

                // Fetch conversations that match this document
                const response = await fetch(`/api/conversations?userId=${session.user.id}&limit=20&messageLimit=50`, {
                    credentials: 'include',
                });

                if (response.ok) {
                    const data = await response.json();
                    const conversations = data.conversations || [];

                    // Filter to study conversations for this document
                    const studyConvs = conversations
                        .filter((c: any) => c.title?.startsWith(titlePattern) || c.title === docTitle)
                        .map((c: any) => ({
                            id: c.id,
                            title: c.title,
                            updatedAt: c.updatedAt,
                            messageCount: c.messages?.length || 0
                        }));

                    setStudyConversations(studyConvs);

                    // Load the most recent conversation if available
                    if (studyConvs.length > 0) {
                        const mostRecent = studyConvs[0];
                        const conv = conversations.find((c: any) => c.id === mostRecent.id);
                        if (conv?.messages?.length > 0) {
                            const loadedMessages = conv.messages.map((msg: any) => ({
                                role: msg.role as 'user' | 'model' | 'system',
                                content: msg.content,
                                createdAt: msg.createdAt,
                                citations: msg.citations || undefined
                            }));
                            setMessages(loadedMessages);
                            setConversationId(conv.id);
                            console.log('Loaded study conversation:', conv.id, 'with', loadedMessages.length, 'messages');
                        }
                    }
                }
            } catch (error) {
                console.error('Error loading study conversations:', error);
            }
        };

        loadStudyConversations();
    }, [mode, documentContext?.documentId, session?.user?.id]);

    // Save conversation after messages change (debounced)
    const saveConversation = useCallback(async (currentMessages: ExtendedChatMessage[]) => {
        if (mode !== 'embedded' || !documentContext?.documentId || !session?.user?.id) return;
        if (currentMessages.length === 0) return;

        // Don't save while streaming
        const lastMsg = currentMessages[currentMessages.length - 1];
        if (lastMsg?.role === 'model' && lastMsg?.content === '') return;

        try {
            const docTitle = documentContext.title || 'Study Session';
            const title = `Study: ${docTitle}`;

            const payload = {
                id: conversationId || undefined,
                title,
                messages: currentMessages.map(m => ({
                    role: m.role,
                    content: m.content,
                    citations: m.citations || null
                })),
                userId: session.user.id
            };

            const response = await fetch('/api/conversations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                credentials: 'include',
            });

            if (response.ok) {
                const savedConv = await response.json();
                if (!conversationId) {
                    setConversationId(savedConv.id);
                    console.log('Created new study conversation:', savedConv.id);
                } else {
                    console.log('Updated study conversation:', savedConv.id);
                }
            }
        } catch (error) {
            console.error('Error saving study conversation:', error);
        }
    }, [mode, documentContext?.documentId, documentContext?.title, session?.user?.id, conversationId]);

    // Start a new chat for study mode
    const handleNewStudyChat = useCallback(() => {
        setMessages([]);
        setConversationId(null);
        setShowHistory(false);
        hasLoadedConversation.current = true; // Prevent auto-load
        console.log('Started new study chat');
    }, []);

    // Load a specific conversation from history
    const loadConversation = useCallback(async (convId: string) => {
        if (!session?.user?.id) return;

        try {
            const response = await fetch(`/api/conversations/${convId}`, {
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                const conv = data.conversation;
                const loadedMessages = conv.messages.map((msg: any) => ({
                    role: msg.role as 'user' | 'model' | 'system',
                    content: msg.content,
                    createdAt: msg.createdAt,
                    citations: msg.citations || undefined
                }));
                setMessages(loadedMessages);
                setConversationId(conv.id);
                setShowHistory(false);
                console.log('Loaded conversation:', conv.id);
            }
        } catch (error) {
            console.error('Error loading conversation:', error);
        }
    }, [session?.user?.id]);

    // Handle pending query from explain button - reactive prop
    useEffect(() => {
        if (pendingQuery && pendingQuery !== lastProcessedQuery.current && !isLoading && session?.user?.id) {
            lastProcessedQuery.current = pendingQuery;
            sendMessage(pendingQuery);
            onQueryProcessed?.();
        }
    }, [pendingQuery, isLoading, session?.user?.id]);

    // Copy handler
    const handleCopy = async (idx: number, content: string) => {
        try {
            await navigator.clipboard.writeText(content);
            setCopiedIdx(idx);
            setTimeout(() => setCopiedIdx(null), 1200);
        } catch (err) {
            console.error('Failed to copy text:', err);
        }
    };

    // Feedback handler
    const handleFeedback = async (idx: number, rating: 'thumbs_up' | 'thumbs_down') => {
        if (!session?.user?.id) return;
        const message = messages[idx];
        if (!message || message.role !== 'model') return;

        setMessages(prev => {
            const updated = [...prev];
            if (updated[idx]) {
                updated[idx] = { ...updated[idx], feedback: rating };
            }
            return updated;
        });

        // Send feedback to server
        try {
            await fetch('/api/feedback/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rating, messageContent: message.content }),
            });
        } catch (error) {
            console.error('Failed to save feedback:', error);
        }
    };

    // Stop streaming
    const handleStopStreaming = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        if (readerRef.current) {
            readerRef.current.cancel().catch(() => { });
            readerRef.current = null;
        }
        setIsStreaming(false);
        setIsLoading(false);
    }, []);

    // Stream chat API
    async function streamChatApi(
        userMessage: string,
        history: ExtendedChatMessage[],
        onChunk: (chunk: string) => void,
        onCitations?: (citations: Array<{ lecturerName: string; documentTitle: string }>) => void,
        abortSignal?: AbortSignal
    ) {
        // Build request body with optional study mode context
        const requestBody: Record<string, unknown> = {
            message: userMessage,
            conversationHistory: history.map(m => ({ role: m.role, content: m.content })),
        };

        // If in embedded (study) mode, add context to help RAG find the right document
        if (mode === 'embedded' && documentContext) {
            requestBody.isStudyMode = true;
            requestBody.studyContext = {
                documentId: documentContext.documentId,
                documentTitle: documentContext.title,
                sectionTitle: documentContext.sectionTitle,
            };
        }

        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
            signal: abortSignal,
        });

        if (!response.ok) throw new Error('Failed to get response');
        if (!response.body) throw new Error('No response body');

        const reader = response.body.getReader();
        readerRef.current = reader;
        const decoder = new TextDecoder();
        let buffer = '';

        try {
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                let lines = buffer.split('\n');
                buffer = lines.pop() || '';
                for (const line of lines) {
                    if (line.trim()) {
                        try {
                            const parsed = JSON.parse(line);
                            if (parsed.type === 'citations' && parsed.citations && onCitations) {
                                onCitations(parsed.citations);
                            } else if (parsed.chunk) {
                                onChunk(parsed.chunk);
                            }
                        } catch { }
                    }
                }
            }
            if (buffer.trim() && !abortSignal?.aborted) {
                try {
                    const parsed = JSON.parse(buffer);
                    if (parsed.type === 'citations' && parsed.citations && onCitations) {
                        onCitations(parsed.citations);
                    } else if (parsed.chunk) {
                        onChunk(parsed.chunk);
                    }
                } catch { }
            }
        } finally {
            readerRef.current = null;
        }
    }

    // Core send message logic
    const sendMessage = async (messageText: string) => {
        if (!messageText.trim() || isLoading || !session?.user?.id) return;

        const userMessage = messageText.trim();

        const userMsg: ExtendedChatMessage = {
            role: 'user',
            content: userMessage,
            createdAt: new Date().toISOString(),
        };

        const aiLoadingMsg: ExtendedChatMessage = {
            role: 'model',
            content: '',
            hasContext: false,
            createdAt: new Date().toISOString(),
        };

        setMessages(prev => [...prev, userMsg, aiLoadingMsg]);
        setIsLoading(true);
        setIsStreaming(true);

        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        try {
            await streamChatApi(
                userMessage,
                messages,
                (chunk) => {
                    setMessages(prev => {
                        const updated = [...prev];
                        const lastIdx = updated.length - 1;
                        if (updated[lastIdx]?.role === 'model') {
                            updated[lastIdx] = {
                                ...updated[lastIdx],
                                content: (updated[lastIdx].content || '') + chunk,
                            };
                        }
                        return updated;
                    });
                },
                (newCitations) => {
                    setMessages(prev => {
                        const updated = [...prev];
                        const lastIdx = updated.length - 1;
                        if (updated[lastIdx]?.role === 'model') {
                            updated[lastIdx] = {
                                ...updated[lastIdx],
                                citations: newCitations,
                                hasContext: true,
                            };
                        }
                        return updated;
                    });
                },
                abortController.signal
            );
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                setMessages(prev => {
                    const updated = [...prev];
                    const lastIdx = updated.length - 1;
                    if (updated[lastIdx]?.role === 'model' && !updated[lastIdx].content) {
                        updated[lastIdx] = {
                            ...updated[lastIdx],
                            content: 'I apologize, but I encountered an error. Please try again.',
                        };
                    }
                    return updated;
                });
            }
        } finally {
            setIsLoading(false);
            setIsStreaming(false);
            abortControllerRef.current = null;

            // Auto-save conversation after message completes (for study mode)
            if (mode === 'embedded') {
                // Use setTimeout to ensure state is updated before saving
                setTimeout(() => {
                    saveConversation(messagesRef.current);
                }, 500);
            }
        }
    };

    // Form submit handler
    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        const messageText = input.trim();
        setInput('');
        await sendMessage(messageText);
    };

    // Edit handlers
    const handleEdit = (idx: number) => {
        setEditingIdx(idx);
        setEditingText(messages[idx]?.content || '');
    };

    const handleEditCancel = () => {
        setEditingIdx(null);
        setEditingText('');
    };

    const handleEditSave = async (idx: number) => {
        if (!editingText.trim()) return;

        const updatedMessages = [...messages];
        updatedMessages[idx] = { ...updatedMessages[idx], content: editingText.trim() };
        const messagesToKeep = updatedMessages.slice(0, idx + 1);

        const aiLoadingMsg: ExtendedChatMessage = {
            role: 'model',
            content: '',
            hasContext: false,
            createdAt: new Date().toISOString(),
        };

        setMessages([...messagesToKeep, aiLoadingMsg]);
        setEditingIdx(null);
        setEditingText('');
        setIsLoading(true);
        setIsStreaming(true);

        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        try {
            await streamChatApi(
                editingText.trim(),
                messagesToKeep.slice(0, -1),
                (chunk) => {
                    setMessages(prev => {
                        const updated = [...prev];
                        const lastIdx = updated.length - 1;
                        if (updated[lastIdx]?.role === 'model') {
                            updated[lastIdx] = {
                                ...updated[lastIdx],
                                content: (updated[lastIdx].content || '') + chunk,
                            };
                        }
                        return updated;
                    });
                },
                undefined,
                abortController.signal
            );
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                setMessages(prev => {
                    const updated = [...prev];
                    const lastIdx = updated.length - 1;
                    if (updated[lastIdx]?.role === 'model' && !updated[lastIdx].content) {
                        updated[lastIdx] = {
                            ...updated[lastIdx],
                            content: 'I apologize, but I encountered an error. Please try again.',
                        };
                    }
                    return updated;
                });
            }
        } finally {
            setIsLoading(false);
            setIsStreaming(false);
            abortControllerRef.current = null;
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend(e);
        }
    };

    const isEmbedded = mode === 'embedded';

    return (
        <div className={`flex flex-col h-full bg-white dark:[background-color:#0C120C] ${isEmbedded ? 'border-l border-gray-200 dark:border-white/10' : ''} ${className}`}>

            {/* Header with history buttons for embedded mode */}
            {isEmbedded && (
                <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-white/10">
                    <button
                        onClick={handleNewStudyChat}
                        className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-white/70 hover:text-green-600 dark:hover:text-[#00A400] transition-colors"
                        title="New Chat"
                    >
                        <PlusIcon className="h-4 w-4" />
                        <span>New</span>
                    </button>
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className={`flex items-center gap-1.5 text-xs transition-colors ${showHistory ? 'text-green-600 dark:text-[#00A400]' : 'text-gray-600 dark:text-white/70 hover:text-green-600 dark:hover:text-[#00A400]'}`}
                        title="Chat History"
                    >
                        <ClockIcon className="h-4 w-4" />
                        <span>History</span>
                        {studyConversations.length > 0 && !showHistory && (
                            <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                                {studyConversations.length}
                            </span>
                        )}
                    </button>
                </div>
            )}

            {/* History panel overlay */}
            {showHistory && isEmbedded && (
                <div className="absolute inset-0 z-40 bg-white dark:[background-color:#0C120C] flex flex-col">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-white/10">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Chat History</h3>
                        <button
                            onClick={() => setShowHistory(false)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-white/5 rounded"
                        >
                            <XMarkIcon className="h-5 w-5 text-gray-700 dark:text-white" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {studyConversations.length === 0 ? (
                            <p className="text-center text-gray-500 dark:text-white/50 text-sm py-8">
                                No chat history yet
                            </p>
                        ) : (
                            studyConversations.map((conv) => (
                                <button
                                    key={conv.id}
                                    onClick={() => loadConversation(conv.id)}
                                    className={`w-full text-left p-3 rounded-lg transition-colors ${conversationId === conv.id
                                            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                                            : 'bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10'
                                        }`}
                                >
                                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                        {conv.title}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-white/50 mt-1">
                                        {conv.messageCount} messages • {new Date(conv.updatedAt).toLocaleDateString()}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                    <div className="p-3 border-t border-gray-200 dark:border-white/10">
                        <button
                            onClick={handleNewStudyChat}
                            className="w-full py-2 px-4 bg-green-600 dark:bg-[#00A400] text-white rounded-lg hover:bg-green-700 dark:hover:bg-[#008300] transition-colors text-sm font-medium flex items-center justify-center gap-2"
                        >
                            <PlusIcon className="h-4 w-4" />
                            Start New Chat
                        </button>
                    </div>
                </div>
            )}

            {/* Messages */}
            <div className={`flex-1 overflow-y-auto ${isEmbedded ? 'p-4' : 'px-4 md:px-8 lg:px-16 py-8'}`}>
                {messages.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-500 dark:text-white/50 text-sm">
                            {isEmbedded
                                ? 'Highlight text and click "Explain" or type a question below.'
                                : 'Start a conversation by typing a message below.'}
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4 md:gap-6">
                        {messages.map((message, idx) => (
                            <div key={idx} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className="relative group max-w-[95%] md:max-w-[80%]">
                                    <div className={`p-3 md:p-4 transition-all duration-200 text-gray-900 dark:text-white ${message.role === 'user'
                                        ? 'bg-green-100 dark:[background-color:#2D3A2D] rounded-[18px_18px_0px_18px]'
                                        : 'bg-white dark:bg-transparent border border-gray-200 dark:border-transparent rounded-2xl'
                                        }`}>
                                        {editingIdx === idx ? (
                                            <div className="space-y-3">
                                                <textarea
                                                    value={editingText}
                                                    onChange={(e) => setEditingText(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Escape') handleEditCancel();
                                                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleEditSave(idx);
                                                    }}
                                                    className="w-full p-3 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                                                    rows={4}
                                                    autoFocus
                                                />
                                                <div className="flex items-center justify-end gap-3">
                                                    <button onClick={handleEditCancel} className="px-3 py-1.5 text-sm text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white">
                                                        Cancel
                                                    </button>
                                                    <button onClick={() => handleEditSave(idx)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-600 dark:bg-[#00A400] text-white rounded-lg hover:bg-green-700">
                                                        <PaperAirplaneIcon className="w-4 h-4" />
                                                        <span>Send</span>
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <MarkdownWithMath content={message.content || ''} role={message.role} />
                                                {message.hasContext && (
                                                    <div className="mt-1.5 text-xs text-gray-600 dark:text-white/70 italic">
                                                        Information from uploaded documents
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {/* Action buttons */}
                                    <div className={`flex items-center gap-2 ${message.role === 'user' ? 'justify-end mt-2' : 'justify-start pl-3 mt-0.5'}`}>
                                        <button
                                            onClick={() => handleCopy(idx, message.content)}
                                            className="text-gray-500 hover:text-green-600 dark:hover:text-[#00A400] transition-colors"
                                            title="Copy"
                                        >
                                            {copiedIdx === idx ? (
                                                <span className="text-xs text-green-600 dark:text-[#00A400] font-medium">Copied!</span>
                                            ) : (
                                                <ClipboardIcon className="h-4 w-4" />
                                            )}
                                        </button>
                                        {message.role === 'model' && (
                                            <>
                                                <button
                                                    onClick={() => handleFeedback(idx, 'thumbs_up')}
                                                    className={`transition-colors ${message.feedback === 'thumbs_up' ? 'text-green-600' : 'text-gray-500 hover:text-green-600'}`}
                                                    title="Helpful"
                                                >
                                                    {message.feedback === 'thumbs_up' ? <HandThumbUpIconSolid className="h-4 w-4" /> : <HandThumbUpIcon className="h-4 w-4" />}
                                                </button>
                                                <button
                                                    onClick={() => handleFeedback(idx, 'thumbs_down')}
                                                    className={`transition-colors ${message.feedback === 'thumbs_down' ? 'text-red-600' : 'text-gray-500 hover:text-red-600'}`}
                                                    title="Not helpful"
                                                >
                                                    {message.feedback === 'thumbs_down' ? <HandThumbDownIconSolid className="h-4 w-4" /> : <HandThumbDownIcon className="h-4 w-4" />}
                                                </button>
                                                {message.citations && message.citations.length > 0 && (
                                                    <button
                                                        onClick={() => setShowCitationsFor(showCitationsFor === idx ? null : idx)}
                                                        className="text-xs text-gray-500 hover:text-green-600 dark:hover:text-[#00A400] underline"
                                                    >
                                                        Sources
                                                    </button>
                                                )}
                                            </>
                                        )}
                                        {message.role === 'user' && (
                                            <button
                                                onClick={() => handleEdit(idx)}
                                                className="text-gray-500 hover:text-green-600 transition-colors"
                                                title="Edit"
                                            >
                                                <PencilIcon className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Citations popup */}
                                    {showCitationsFor === idx && message.citations && (
                                        <>
                                            <div className="fixed inset-0 z-[45]" onClick={() => setShowCitationsFor(null)} />
                                            <div className="absolute z-[60] left-0 bottom-full mb-2 p-3 bg-gray-100 dark:bg-[#2D3A2D] border border-gray-300 dark:border-green-800/50 rounded-lg shadow-lg max-w-sm min-w-[200px]">
                                                <div className="text-xs font-semibold text-gray-700 dark:text-green-100 mb-2">Sources:</div>
                                                <div className="space-y-2">
                                                    {message.citations.map((citation, citIdx) => (
                                                        <div key={citIdx} className="text-xs text-gray-600 dark:text-green-200/80 leading-relaxed">
                                                            {formatAuthorName(citation.lecturerName)}. <span className="italic">{citation.documentTitle}</span> [Lecture notes]. University of Jos.
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Loading indicator */}
                        {isLoading && messages[messages.length - 1]?.content === '' && (
                            <div className="flex justify-start">
                                <div className="p-4 text-gray-900 dark:text-white animate-pulse">
                                    <div className="flex items-center gap-3">
                                        <div className="flex space-x-1">
                                            <div className="w-2.5 h-2.5 rounded-full animate-bounce bg-green-600 dark:bg-[#00A400]"></div>
                                            <div className="w-2.5 h-2.5 rounded-full animate-bounce bg-green-600 dark:bg-[#00A400]" style={{ animationDelay: '0.1s' }}></div>
                                            <div className="w-2.5 h-2.5 rounded-full animate-bounce bg-green-600 dark:bg-[#00A400]" style={{ animationDelay: '0.2s' }}></div>
                                        </div>
                                        <span className="text-sm font-medium">Thinking...</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            {/* Input area */}
            <div className={`flex-shrink-0 border-t border-gray-200 dark:border-white/10 ${isEmbedded ? 'p-4' : 'p-4 md:px-8 lg:px-16'}`}>
                <form onSubmit={handleSend} className="flex items-end gap-2">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your message..."
                        rows={1}
                        className="flex-1 px-4 py-3 bg-gray-100 dark:bg-[#2D3A2D] border border-gray-200 dark:border-white/10 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-[#00A400] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/50 text-sm"
                        disabled={isLoading}
                    />
                    {isStreaming ? (
                        <button
                            type="button"
                            onClick={handleStopStreaming}
                            className="p-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
                            title="Stop generating"
                        >
                            <StopIcon className="h-5 w-5" />
                        </button>
                    ) : (
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="p-3 bg-green-600 dark:bg-[#00A400] text-white rounded-xl hover:bg-green-700 dark:hover:bg-[#008300] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <PaperAirplaneIcon className="h-5 w-5" />
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
}
