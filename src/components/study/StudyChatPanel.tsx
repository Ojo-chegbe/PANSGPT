'use client';

import React, { useRef, useEffect } from 'react';
import { XMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import MarkdownWithMath from '@/components/MarkdownWithMath';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

interface StudyChatPanelProps {
    isOpen: boolean;
    onClose: () => void;
    messages: ChatMessage[];
    input: string;
    setInput: (value: string) => void;
    onSend: () => void;
    isLoading: boolean;
    documentTitle?: string;
}

export default function StudyChatPanel({
    isOpen,
    onClose,
    messages,
    input,
    setInput,
    onSend,
    isLoading,
    documentTitle,
}: StudyChatPanelProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input when panel opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSend();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="w-full h-full flex flex-col bg-white dark:[background-color:#0C120C] border-l border-gray-200 dark:border-white/10">
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-200 dark:border-white/10">
                <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Study Chat</h3>
                    {documentTitle && (
                        <p className="text-xs text-gray-500 dark:text-white/50 truncate max-w-[200px]">
                            {documentTitle}
                        </p>
                    )}
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg"
                >
                    <XMarkIcon className="h-5 w-5 text-gray-700 dark:text-white" />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-500 dark:text-white/50 text-sm">
                            Highlight text in the document and click "Explain" to start a conversation.
                        </p>
                    </div>
                ) : (
                    messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[85%] p-3 rounded-2xl ${msg.role === 'user'
                                    ? 'bg-green-600 dark:bg-[#00A400] text-white rounded-br-md'
                                    : 'bg-gray-100 dark:bg-[#2D3A2D] text-gray-900 dark:text-white rounded-bl-md'
                                    }`}
                            >
                                {msg.role === 'assistant' ? (
                                    <div className="prose prose-sm dark:prose-invert max-w-none">
                                        <MarkdownWithMath content={msg.content || 'No response received.'} role="model" />
                                    </div>
                                ) : (
                                    <p className="text-sm whitespace-pre-wrap">{msg.content || ''}</p>
                                )}
                            </div>
                        </div>
                    ))
                )}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-100 dark:bg-[#2D3A2D] p-3 rounded-2xl rounded-bl-md">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" />
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-white/10">
                <div className="flex items-end gap-2">
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask a follow-up question..."
                        rows={1}
                        className="flex-1 px-4 py-3 bg-gray-100 dark:bg-[#2D3A2D] border border-gray-200 dark:border-white/10 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-[#00A400] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/50 text-sm"
                    />
                    <button
                        onClick={onSend}
                        disabled={!input.trim() || isLoading}
                        className="p-3 bg-green-600 dark:bg-[#00A400] text-white rounded-xl hover:bg-green-700 dark:hover:bg-[#008300] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <PaperAirplaneIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
