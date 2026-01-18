'use client';

import React, { useEffect, useState, useCallback, useRef, TouchEvent, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeftIcon,
    Bars3Icon,
    XMarkIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    BookOpenIcon,
    ChatBubbleLeftRightIcon,
    ListBulletIcon,
} from '@heroicons/react/24/outline';
import { Section, Paragraph, StructuredDocument } from '@/lib/parse-document';
import MarkdownWithMath from '@/components/MarkdownWithMath';
import ChatInterface from '@/components/chat/ChatInterface';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';

interface DocumentData {
    id: string;
    title: string;
    fileName: string;
    courseCode: string;
    courseTitle: string;
    professorName: string;
    topic: string;
    level: string;
}

interface Navigation {
    prev: { id: string; title: string } | null;
    next: { id: string; title: string } | null;
}

interface StudyReaderProps {
    documentId: string;
}

// Page content item
interface PageContent {
    type: 'heading' | 'paragraph';
    text: string;
    level?: number;
    paragraphType?: string;
}

// Estimate characters per page based on viewport
const CHARS_PER_PAGE_MOBILE = 1800; // ~1800 chars per mobile page for fuller content

export default function StudyReader({ documentId }: StudyReaderProps) {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [docData, setDocData] = useState<DocumentData | null>(null);
    const [structuredContent, setStructuredContent] = useState<StructuredDocument | null>(null);
    const [navigation, setNavigation] = useState<Navigation | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeSection, setActiveSection] = useState<string | null>(null);

    // Mobile page navigation
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [isMobile, setIsMobile] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [showPagesModal, setShowPagesModal] = useState(false);

    // Touch/swipe handling
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const minSwipeDistance = 50;

    // AI Explain popup state
    const [selectedText, setSelectedText] = useState('');
    const [showExplainPopup, setShowExplainPopup] = useState(false);
    const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
    const [isExplaining, setIsExplaining] = useState(false);
    const [explanation, setExplanation] = useState<string | null>(null);
    const [explainType, setExplainType] = useState<string>('explain');

    // Chat panel state (desktop: side panel, mobile: tab view)
    const [chatOpen, setChatOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'study' | 'chat'>('study');
    const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([]);
    const [chatInput, setChatInput] = useState('');
    const [isSendingChat, setIsSendingChat] = useState(false);
    const [pendingQuery, setPendingQuery] = useState<string | undefined>(undefined);

    // Onboarding tutorial popup
    const [showTutorial, setShowTutorial] = useState(false);

    // Scroll-based progress (works for both mobile and desktop scroll views)
    const [scrollProgress, setScrollProgress] = useState(0);

    const contentRef = useRef<HTMLDivElement>(null);
    const mobileScrollRef = useRef<HTMLDivElement>(null);
    const desktopScrollRef = useRef<HTMLDivElement>(null);
    const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());
    const hasFetched = useRef(false);
    const hasRestoredScroll = useRef(false);

    // Check if user has seen the tutorial
    useEffect(() => {
        const hasSeenTutorial = localStorage.getItem('study_tutorial_seen');
        if (!hasSeenTutorial) {
            // Small delay to let the page load first
            const timer = setTimeout(() => {
                setShowTutorial(true);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, []);

    const dismissTutorial = () => {
        setShowTutorial(false);
        localStorage.setItem('study_tutorial_seen', 'true');
    };

    const openTutorial = () => {
        setShowTutorial(true);
    };

    // Detect mobile viewport - account for landscape orientation
    // Mobile in landscape has width > 768 but height is typically < 500
    useEffect(() => {
        const checkMobile = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            // Consider mobile if:
            // 1. Width is less than 768 (portrait mode)
            // 2. OR height is less than 500 and width < 1024 (landscape on phone/small tablet)
            const isMobileDevice = width < 768 || (height < 500 && width < 1024);
            setIsMobile(isMobileDevice);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        window.addEventListener('orientationchange', checkMobile);
        return () => {
            window.removeEventListener('resize', checkMobile);
            window.removeEventListener('orientationchange', checkMobile);
        };
    }, []);

    // Generate paginated content for mobile - split content to fill pages
    const paginatedContent = useMemo(() => {
        if (!structuredContent?.sections) return [];

        const pages: PageContent[][] = [];
        let currentPage: PageContent[] = [];
        let currentPageChars = 0;

        structuredContent.sections.forEach((section) => {
            // Add section heading
            const headingText = section.title.replace(/^#+\s*/, '').replace(/\*\*/g, '').replace(/__/g, '');
            const headingChars = headingText.length + 50; // Extra chars for heading styling

            // If heading would overflow, start new page
            if (currentPageChars + headingChars > CHARS_PER_PAGE_MOBILE && currentPage.length > 0) {
                pages.push(currentPage);
                currentPage = [];
                currentPageChars = 0;
            }

            currentPage.push({
                type: 'heading',
                text: headingText,
                level: section.level,
            });
            currentPageChars += headingChars;

            // Add paragraphs
            section.content.forEach((paragraph) => {
                const paraChars = paragraph.text.length;

                // If paragraph is very long, split it
                if (paraChars > CHARS_PER_PAGE_MOBILE) {
                    // Split long paragraph into multiple pages
                    const sentences = paragraph.text.split(/(?<=[.!?])\s+/);
                    let currentChunk = '';

                    sentences.forEach((sentence) => {
                        if ((currentChunk + sentence).length > CHARS_PER_PAGE_MOBILE - currentPageChars) {
                            if (currentChunk) {
                                currentPage.push({
                                    type: 'paragraph',
                                    text: currentChunk.trim(),
                                    paragraphType: paragraph.type,
                                });
                            }
                            pages.push(currentPage);
                            currentPage = [];
                            currentPageChars = 0;
                            currentChunk = sentence + ' ';
                        } else {
                            currentChunk += sentence + ' ';
                        }
                    });

                    if (currentChunk.trim()) {
                        currentPage.push({
                            type: 'paragraph',
                            text: currentChunk.trim(),
                            paragraphType: paragraph.type,
                        });
                        currentPageChars += currentChunk.length;
                    }
                } else {
                    // Normal paragraph
                    if (currentPageChars + paraChars > CHARS_PER_PAGE_MOBILE && currentPage.length > 0) {
                        pages.push(currentPage);
                        currentPage = [];
                        currentPageChars = 0;
                    }

                    currentPage.push({
                        type: 'paragraph',
                        text: paragraph.text,
                        paragraphType: paragraph.type,
                    });
                    currentPageChars += paraChars;
                }
            });
        });

        // Don't forget the last page
        if (currentPage.length > 0) {
            pages.push(currentPage);
        }

        return pages;
    }, [structuredContent]);

    const totalPages = paginatedContent.length;

    // Auto-hide controls after inactivity on mobile
    useEffect(() => {
        if (!isMobile) return;

        let timeout: NodeJS.Timeout;
        const resetTimer = () => {
            setShowControls(true);
            clearTimeout(timeout);
            timeout = setTimeout(() => setShowControls(false), 4000);
        };

        window.addEventListener('touchstart', resetTimer);
        resetTimer();

        return () => {
            window.removeEventListener('touchstart', resetTimer);
            clearTimeout(timeout);
        };
    }, [isMobile]);

    // Fetch document content
    useEffect(() => {
        if (hasFetched.current) return;
        if (status === 'loading') return;
        if (!session) {
            router.push('/login');
            return;
        }

        const fetchDocument = async () => {
            try {
                setIsLoading(true);
                const response = await fetch(`/api/documents/${documentId}/content`);

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || 'Failed to fetch document');
                }

                const data = await response.json();
                setDocData(data.document);
                setStructuredContent(data.structuredContent);
                setNavigation(data.navigation);

                if (data.structuredContent?.sections?.length > 0) {
                    setActiveSection(data.structuredContent.sections[0].id);
                }

                hasFetched.current = true;
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDocument();
    }, [documentId, status, router, session]);

    useEffect(() => {
        hasFetched.current = false;
        hasRestoredScroll.current = false;
    }, [documentId]);

    // Calculate scroll progress (called on every scroll for immediate UI update)
    const updateScrollProgress = useCallback(() => {
        const scrollContainer = isMobile ? mobileScrollRef.current : desktopScrollRef.current;
        if (scrollContainer) {
            const scrollTop = scrollContainer.scrollTop;
            const scrollHeight = scrollContainer.scrollHeight;
            const clientHeight = scrollContainer.clientHeight;
            const progress = scrollHeight > clientHeight ? (scrollTop / (scrollHeight - clientHeight)) * 100 : 0;
            setScrollProgress(Math.min(100, Math.round(progress)));
            return progress;
        }
        return 0;
    }, [isMobile]);

    // Save scroll position to localStorage (debounced)
    const saveScrollPosition = useCallback(() => {
        const scrollContainer = isMobile ? mobileScrollRef.current : desktopScrollRef.current;
        if (scrollContainer && documentId) {
            const scrollTop = scrollContainer.scrollTop;
            const scrollHeight = scrollContainer.scrollHeight;
            const clientHeight = scrollContainer.clientHeight;
            const progress = scrollHeight > clientHeight ? (scrollTop / (scrollHeight - clientHeight)) * 100 : 0;

            localStorage.setItem(`study_scroll_${documentId}`, JSON.stringify({
                scrollTop,
                progress: Math.min(100, Math.round(progress)),
                timestamp: Date.now()
            }));
        }
    }, [documentId, isMobile]);

    // Restore scroll position when content loads
    useEffect(() => {
        if (!structuredContent || hasRestoredScroll.current || isLoading) return;

        const savedData = localStorage.getItem(`study_scroll_${documentId}`);
        if (savedData) {
            try {
                const { scrollTop } = JSON.parse(savedData);
                // Wait for render to complete, then restore scroll
                setTimeout(() => {
                    const scrollContainer = isMobile ? mobileScrollRef.current : desktopScrollRef.current;
                    if (scrollContainer) {
                        scrollContainer.scrollTop = scrollTop;
                        hasRestoredScroll.current = true;
                    }
                }, 100);
            } catch (e) {
                console.error('Failed to restore scroll position:', e);
            }
        } else {
            hasRestoredScroll.current = true;
        }
    }, [structuredContent, documentId, isMobile, isLoading]);

    // Attach scroll listener - update progress immediately, debounce localStorage save
    useEffect(() => {
        const scrollContainer = isMobile ? mobileScrollRef.current : desktopScrollRef.current;
        if (!scrollContainer) return;

        let saveTimeout: NodeJS.Timeout;
        const handleScroll = () => {
            // Update progress bar immediately (no debounce)
            updateScrollProgress();
            // Debounce localStorage save
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(saveScrollPosition, 300);
        };

        scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            scrollContainer.removeEventListener('scroll', handleScroll);
            clearTimeout(saveTimeout);
        };
    }, [saveScrollPosition, updateScrollProgress, isMobile, structuredContent]);

    // Handle text selection
    const handleTextSelection = useCallback(() => {
        const selection = window.getSelection();
        const text = selection?.toString().trim();

        if (text && text.length > 2) {
            setSelectedText(text);
            const range = selection?.getRangeAt(0);
            const rect = range?.getBoundingClientRect();
            if (rect) {
                setPopupPosition({
                    x: rect.left + rect.width / 2,
                    y: rect.top - 10,
                });
                setShowExplainPopup(true);
                setExplanation(null);
            }
        } else {
            if (!isExplaining) {
                setShowExplainPopup(false);
            }
        }
    }, [isExplaining]);

    useEffect(() => {
        const handleMouseUp = () => {
            setTimeout(handleTextSelection, 10);
        };

        // Handle touch selection on mobile - use longer delay to let selection complete
        const handleTouchEnd = () => {
            setTimeout(handleTextSelection, 300);
        };

        // Also listen for selection changes (works better on some mobile browsers)
        const handleSelectionChange = () => {
            // Only trigger on mobile and with a delay to avoid rapid firing
            if (isMobile) {
                setTimeout(handleTextSelection, 100);
            }
        };

        window.document.addEventListener('mouseup', handleMouseUp);
        window.document.addEventListener('touchend', handleTouchEnd);
        document.addEventListener('selectionchange', handleSelectionChange);

        return () => {
            window.document.removeEventListener('mouseup', handleMouseUp);
            window.document.removeEventListener('touchend', handleTouchEnd);
            document.removeEventListener('selectionchange', handleSelectionChange);
        };
    }, [handleTextSelection, isMobile]);

    // Touch handlers for swipe navigation
    const onTouchStart = (e: TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            goToNextPage();
        }
        if (isRightSwipe) {
            goToPrevPage();
        }
    };

    // Page navigation
    const goToNextPage = () => {
        if (currentPageIndex < totalPages - 1) {
            setCurrentPageIndex(currentPageIndex + 1);
        }
    };

    const goToPrevPage = () => {
        if (currentPageIndex > 0) {
            setCurrentPageIndex(currentPageIndex - 1);
        }
    };

    const goToPage = (index: number) => {
        setCurrentPageIndex(index);
        setSidebarOpen(false);
    };

    // Desktop scroll to section
    const scrollToSection = (sectionId: string) => {
        const element = sectionRefs.current.get(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setActiveSection(sectionId);
        }
        setSidebarOpen(false);
    };

    // AI Explain function - now uses chat panel
    const handleExplain = (type: string) => {
        setExplainType(type);
        setShowExplainPopup(false);

        // Create user message
        const userMessage = type === 'explain'
            ? `Please explain this concept from my study material: "${selectedText}"`
            : type === 'example'
                ? `Please give me a practical example for this concept: "${selectedText}"`
                : type === 'define'
                    ? `Please define this term: "${selectedText}"`
                    : type === 'remember'
                        ? `Help me remember this concept with a mnemonic or memory aid: "${selectedText}"`
                        : `Please quiz me on this topic: "${selectedText}"`;

        // Set pending query for ChatInterface to process
        setPendingQuery(userMessage);

        // Open chat panel (desktop) or switch to chat tab (mobile)
        if (isMobile) {
            setActiveTab('chat');
        } else {
            setChatOpen(true);
        }

        setSelectedText('');
    };

    // Send follow-up chat message
    const sendChatMessage = async () => {
        if (!chatInput.trim() || isSendingChat) return;

        const userMessage = chatInput.trim();
        setChatInput('');
        setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsSendingChat(true);

        try {
            // Use study explain API which returns JSON
            const response = await fetch('/api/study/explain', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    selectedText: userMessage,
                    documentId,
                    sectionTitle: activeSection,
                    explainType: 'explain',
                }),
            });

            const data = await response.json();
            const responseText = data.explanation || data.response || data.error || 'I received your request but couldn\'t generate a response.';
            setChatMessages(prev => [...prev, { role: 'assistant', content: responseText }]);
        } catch (err) {
            setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
        } finally {
            setIsSendingChat(false);
        }
    };

    const closeExplainPopup = () => {
        setShowExplainPopup(false);
        setSelectedText('');
    };

    // Reading progress - use scroll-based progress for both views
    // For mobile in page mode, use page index; for scroll views, use scroll progress
    const readingProgress = scrollProgress > 0 ? scrollProgress : (totalPages > 0 ? ((currentPageIndex + 1) / totalPages) * 100 : 0);

    // Loading state
    if (status === 'loading' || isLoading) {
        return (
            <div className="h-screen bg-gray-50 dark:[background-color:#0C120C] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                    <p className="text-gray-500 dark:text-white/50">Loading document...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="h-screen bg-gray-50 dark:[background-color:#0C120C] flex items-center justify-center">
                <div className="text-center max-w-md px-4">
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Error Loading Document</h1>
                    <p className="text-gray-500 dark:text-white/50 mb-4">{error}</p>
                    <button
                        onClick={() => router.push('/study')}
                        className="px-4 py-2 bg-green-600 dark:bg-[#00A400] text-white rounded-lg"
                    >
                        Back to Documents
                    </button>
                </div>
            </div>
        );
    }

    const currentPageContent = paginatedContent[currentPageIndex] || [];

    // Render content item
    const renderContentItem = (item: PageContent, index: number) => {
        if (item.type === 'heading') {
            return (
                <h2
                    key={index}
                    className={`font-bold text-gray-900 dark:text-white mb-4 ${item.level === 1 ? 'text-xl' : item.level === 2 ? 'text-lg' : 'text-base'
                        }`}
                >
                    {item.text}
                </h2>
            );
        }

        return (
            <div
                key={index}
                className={`text-gray-700 dark:text-gray-300 leading-relaxed mb-4 text-[15px] ${item.paragraphType === 'note' ? 'bg-yellow-500/10 border-l-4 border-yellow-500 pl-3 py-2 rounded-r' : ''
                    } ${item.paragraphType === 'definition' ? 'bg-blue-500/10 border-l-4 border-blue-500 pl-3 py-2 rounded-r' : ''
                    } ${item.paragraphType === 'example' ? 'bg-green-500/10 border-l-4 border-green-500 pl-3 py-2 rounded-r' : ''}`}
            >
                <MarkdownWithMath content={item.text} role="model" />
            </div>
        );
    };

    // Render section content for desktop
    const renderSectionContent = (section: Section) => (
        <div className="space-y-4">
            {section.content.map((paragraph) => (
                <div
                    key={paragraph.id}
                    className={`text-gray-800 dark:text-gray-200 leading-relaxed ${paragraph.type === 'note' ? 'bg-yellow-500/10 border-l-4 border-yellow-500 pl-4 py-2 rounded-r' : ''
                        } ${paragraph.type === 'definition' ? 'bg-blue-500/10 border-l-4 border-blue-500 pl-4 py-2 rounded-r' : ''
                        } ${paragraph.type === 'example' ? 'bg-green-500/10 border-l-4 border-green-500 pl-4 py-2 rounded-r' : ''}`}
                >
                    <MarkdownWithMath content={paragraph.text} role="model" />
                </div>
            ))}
        </div>
    );

    return (
        <div className="h-screen bg-gray-50 dark:[background-color:#0C120C] flex flex-col overflow-hidden">
            {/* Progress Bar */}
            <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gray-200 dark:bg-white/10">
                <div
                    className="h-full bg-green-500 dark:bg-[#00A400] transition-all duration-300"
                    style={{ width: `${readingProgress}%` }}
                />
            </div>

            {/* Table of Contents Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-40 w-72 bg-white dark:[background-color:#2D3A2D] border-r border-gray-200 dark:border-white/10 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="h-full flex flex-col">
                    {/* Close button */}
                    <div className="p-4 flex items-center justify-start">
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg"
                        >
                            <Bars3Icon className="h-5 w-5 text-gray-700 dark:text-white" />
                        </button>
                    </div>

                    {/* Action buttons */}
                    <div className="px-4 space-y-2">
                        <button
                            onClick={() => {
                                setSidebarOpen(false);
                                router.push('/main');
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors"
                        >
                            <ChatBubbleLeftRightIcon className="h-5 w-5" />
                            <span>Chat Mode</span>
                        </button>

                        <button
                            onClick={() => {
                                setSidebarOpen(false);
                                router.push('/quiz');
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors"
                        >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                            </svg>
                            <span>Take A Quiz</span>
                        </button>
                    </div>

                    {/* Contents section */}
                    <div className="mt-6 px-4">
                        <h3 className="text-sm font-semibold text-green-600 dark:text-[#00A400] mb-2">Contents</h3>
                    </div>

                    <nav className="flex-1 overflow-y-auto px-3 space-y-1">
                        {structuredContent?.sections.map((section, index) => (
                            <button
                                key={section.id}
                                onClick={() => {
                                    if (isMobile) {
                                        // Find which page contains this section
                                        let charCount = 0;
                                        let targetPage = 0;
                                        for (let i = 0; i < index; i++) {
                                            const s = structuredContent.sections[i];
                                            charCount += s.title.length + 50;
                                            s.content.forEach(p => charCount += p.text.length);
                                            if (charCount > CHARS_PER_PAGE_MOBILE * (targetPage + 1)) {
                                                targetPage = Math.floor(charCount / CHARS_PER_PAGE_MOBILE);
                                            }
                                        }
                                        setCurrentPageIndex(Math.min(targetPage, totalPages - 1));
                                    } else {
                                        scrollToSection(section.id);
                                    }
                                    setSidebarOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeSection === section.id
                                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-medium border border-green-200 dark:border-green-800/50'
                                    : 'text-gray-600 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/5'
                                    } ${section.level === 2 ? 'ml-3' : ''} ${section.level === 3 ? 'ml-6' : ''}`}
                            >
                                {section.title.replace(/^#+\s*/, '').replace(/\*\*/g, '').replace(/__/g, '')}
                            </button>
                        ))}
                    </nav>

                    {/* Settings and Help */}
                    <div className="p-4 border-t border-gray-200 dark:border-white/10">
                        <button
                            onClick={() => {
                                setSidebarOpen(false);
                                router.push('/profile');
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2 text-gray-600 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                        >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>Settings and Help</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 bg-black/50 z-30" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Main Content */}
            {isMobile ? (
                // MOBILE: Fixed height pages
                <div className="flex-1 flex flex-col h-screen overflow-hidden">
                    {/* Mobile Header */}
                    <header className={`flex-shrink-0 bg-white dark:[background-color:#0C120C] border-b border-gray-200 dark:border-white/10 transition-all duration-300 ${showControls ? 'h-14 opacity-100' : 'h-0 opacity-0 overflow-hidden'
                        }`}>
                        <div className="flex items-center justify-between px-3 py-2 h-14">
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setSidebarOpen(true)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg"
                                >
                                    <Bars3Icon className="h-5 w-5 text-gray-700 dark:text-white" />
                                </button>
                                <button
                                    onClick={() => router.push('/study')}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg"
                                >
                                    <ArrowLeftIcon className="h-5 w-5 text-gray-700 dark:text-white" />
                                </button>
                            </div>
                            <div className="flex-1 text-center mx-2">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{docData?.title}</p>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => router.push('/profile')}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg"
                                >
                                    <svg className="h-5 w-5 text-gray-700 dark:text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={openTutorial}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg"
                                >
                                    <svg className="h-5 w-5 text-gray-700 dark:text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </header>

                    {/* Mobile Tab Navigation */}
                    <div className="flex-shrink-0 bg-white dark:[background-color:#0C120C] border-b border-gray-200 dark:border-white/10">
                        <div className="flex">
                            <button
                                onClick={() => setActiveTab('study')}
                                className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${activeTab === 'study'
                                    ? 'text-green-600 dark:text-[#00A400] border-b-2 border-green-600 dark:border-[#00A400]'
                                    : 'text-gray-500 dark:text-white/50'
                                    }`}
                            >
                                Study
                            </button>
                            <button
                                onClick={() => setActiveTab('chat')}
                                className={`flex-1 py-3 text-sm font-medium text-center transition-colors relative ${activeTab === 'chat'
                                    ? 'text-green-600 dark:text-[#00A400] border-b-2 border-green-600 dark:border-[#00A400]'
                                    : 'text-gray-500 dark:text-white/50'
                                    }`}
                            >
                                Chat
                                {chatMessages.length > 0 && activeTab !== 'chat' && (
                                    <span className="absolute top-2 right-1/4 w-2 h-2 bg-green-500 rounded-full" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'study' ? (
                        // Mobile Study Content - Normal scrolling view
                        <div ref={mobileScrollRef} className="flex-1 overflow-y-auto">
                            <div className="px-4 py-6 prose prose-sm dark:prose-invert max-w-none">
                                {/* Document Header */}
                                <div className="mb-6 pb-4 border-b border-gray-200 dark:border-white/10 not-prose">
                                    <div className="flex items-center gap-2 text-green-600 dark:text-[#00A400] text-xs mb-2">
                                        <BookOpenIcon className="h-4 w-4" />
                                        <span>{docData?.courseCode} - {docData?.courseTitle}</span>
                                    </div>
                                    <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{docData?.title}</h1>
                                    <p className="text-sm text-gray-500 dark:text-white/50">{docData?.professorName} • {docData?.topic}</p>
                                </div>

                                {/* Document Sections */}
                                {structuredContent?.sections.map((section) => (
                                    <section
                                        key={section.id}
                                        ref={(el) => { if (el) sectionRefs.current.set(section.id, el); }}
                                        className="mb-6"
                                    >
                                        <h2 className={`font-semibold text-gray-900 dark:text-white mb-3 ${section.level === 1 ? 'text-lg' : section.level === 2 ? 'text-base' : 'text-sm'
                                            }`}>
                                            {section.title.replace(/^#+\s*/, '').replace(/\*\*/g, '').replace(/__/g, '')}
                                        </h2>
                                        {renderSectionContent(section)}
                                    </section>
                                ))}

                                {/* Navigation Footer */}
                                <div className="mt-8 pt-4 border-t border-gray-200 dark:border-white/10 flex justify-between not-prose pb-8">
                                    {navigation?.prev && (
                                        <button onClick={() => router.push(`/study/${navigation.prev?.id}`)} className="text-green-600 dark:text-green-400 hover:underline text-sm">
                                            ← Previous
                                        </button>
                                    )}
                                    {navigation?.next && (
                                        <button onClick={() => router.push(`/study/${navigation.next?.id}`)} className="text-green-600 dark:text-green-400 hover:underline text-sm ml-auto">
                                            Next →
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        // Mobile Chat Tab
                        <div className="flex-1 flex flex-col overflow-hidden">
                            <ChatInterface
                                mode="embedded"
                                onClose={() => setActiveTab('study')}
                                pendingQuery={pendingQuery}
                                onQueryProcessed={() => setPendingQuery(undefined)}
                                documentContext={{
                                    documentId: docData?.id,
                                    title: docData?.title,
                                    sectionTitle: activeSection || undefined,
                                }}
                            />
                        </div>
                    )}
                </div>
            ) : (
                // DESKTOP: Scroll view with side panel chat
                <div className="flex-1 flex overflow-hidden">
                    <main ref={desktopScrollRef} className="flex-1 overflow-y-auto pt-1">
                        <header className="sticky top-1 z-20 bg-white dark:[background-color:#0C120C] border-b border-gray-200 dark:border-white/10">
                            <div className="flex items-center justify-between px-4 py-3">
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg">
                                        <Bars3Icon className="h-5 w-5 text-gray-700 dark:text-white" />
                                    </button>
                                    <button onClick={() => router.push('/study')} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg">
                                        <ArrowLeftIcon className="h-5 w-5 text-gray-700 dark:text-white" />
                                    </button>
                                </div>
                                <div className="flex-1 mx-3 text-center">
                                    <h1 className="font-semibold text-gray-900 dark:text-white text-sm truncate">{docData?.title}</h1>
                                    <p className="text-xs text-gray-500 dark:text-white/50">{docData?.courseCode}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setChatOpen(!chatOpen)}
                                        className={`p-2 rounded-lg transition-colors ${chatOpen ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-[#00A400]' : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-700 dark:text-white'}`}
                                        title="Toggle Chat"
                                    >
                                        <ChatBubbleLeftRightIcon className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => router.push('/profile')}
                                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-700 dark:text-white transition-colors"
                                        title="Profile"
                                    >
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={openTutorial}
                                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-700 dark:text-white transition-colors"
                                        title="Help"
                                    >
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                                        </svg>
                                    </button>
                                    {navigation?.prev && (
                                        <button onClick={() => router.push(`/study/${navigation.prev?.id}`)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg">
                                            <ChevronLeftIcon className="h-5 w-5 text-gray-700 dark:text-white" />
                                        </button>
                                    )}
                                    {navigation?.next && (
                                        <button onClick={() => router.push(`/study/${navigation.next?.id}`)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg">
                                            <ChevronRightIcon className="h-5 w-5 text-gray-700 dark:text-white" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </header>

                        <div ref={contentRef} className="max-w-4xl mx-auto px-4 sm:px-8 lg:px-16 py-8 prose prose-gray dark:prose-invert max-w-none">
                            <div className="mb-8 pb-6 border-b border-gray-200 dark:border-white/10 not-prose">
                                <div className="flex items-center gap-2 text-green-600 dark:text-[#00A400] text-sm mb-2">
                                    <BookOpenIcon className="h-4 w-4" />
                                    <span>{docData?.courseCode} - {docData?.courseTitle}</span>
                                </div>
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{docData?.title}</h1>
                                <p className="text-gray-500 dark:text-white/50">{docData?.professorName} • {docData?.topic}</p>
                            </div>

                            {structuredContent?.sections.map((section) => (
                                <section
                                    key={section.id}
                                    ref={(el) => { if (el) sectionRefs.current.set(section.id, el); }}
                                    className="mb-8"
                                >
                                    <h2 className={`font-semibold text-gray-900 dark:text-white mb-4 ${section.level === 1 ? 'text-2xl' : section.level === 2 ? 'text-xl' : 'text-lg'
                                        }`}>
                                        {section.title.replace(/^#+\s*/, '').replace(/\*\*/g, '').replace(/__/g, '')}
                                    </h2>
                                    {renderSectionContent(section)}
                                </section>
                            ))}

                            <div className="mt-12 pt-6 border-t border-gray-200 dark:border-white/10 flex justify-between not-prose">
                                {navigation?.prev && (
                                    <button onClick={() => router.push(`/study/${navigation.prev?.id}`)} className="text-green-600 dark:text-green-400 hover:underline text-sm">
                                        ← Previous: {navigation.prev.title}
                                    </button>
                                )}
                                {navigation?.next && (
                                    <button onClick={() => router.push(`/study/${navigation.next?.id}`)} className="text-green-600 dark:text-green-400 hover:underline text-sm ml-auto">
                                        Next: {navigation.next.title} →
                                    </button>
                                )}
                            </div>
                        </div>
                    </main>

                    {/* Desktop Chat Side Panel */}
                    <aside className={`flex-shrink-0 h-full transition-all duration-300 ${chatOpen ? 'w-96' : 'w-0'} overflow-hidden`}>
                        <ChatInterface
                            mode="embedded"
                            onClose={() => setChatOpen(false)}
                            pendingQuery={pendingQuery}
                            onQueryProcessed={() => setPendingQuery(undefined)}
                            documentContext={{
                                documentId: docData?.id,
                                title: docData?.title,
                                sectionTitle: activeSection || undefined,
                            }}
                        />
                    </aside>
                </div>
            )}

            {/* Pages Modal */}
            {showPagesModal && (
                <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setShowPagesModal(false)}>
                    <div className="absolute inset-0 bg-black/50" />
                    <div
                        className="relative w-full max-w-md bg-white dark:[background-color:#2D3A2D] rounded-t-3xl p-6 pb-10 max-h-[70vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Go to Page</h3>
                            <button
                                onClick={() => setShowPagesModal(false)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg"
                            >
                                <XMarkIcon className="h-5 w-5 text-gray-700 dark:text-white" />
                            </button>
                        </div>
                        <div className="grid grid-cols-6 gap-2">
                            {paginatedContent.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        goToPage(index);
                                        setShowPagesModal(false);
                                    }}
                                    className={`aspect-square rounded-xl text-sm font-semibold transition-all ${currentPageIndex === index
                                        ? 'bg-green-600 dark:bg-[#00A400] text-white scale-110 shadow-lg'
                                        : 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20'
                                        }`}
                                >
                                    {index + 1}
                                </button>
                            ))}
                        </div>
                        <p className="text-center text-sm text-gray-500 dark:text-white/50 mt-4">
                            Currently on page {currentPageIndex + 1} of {totalPages}
                        </p>
                    </div>
                </div>
            )}

            {/* AI Popup */}
            {showExplainPopup && (
                <div
                    className="fixed z-50 bg-white dark:[background-color:#2D3A2D] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl max-w-sm mx-4"
                    style={{
                        left: isMobile ? '50%' : Math.min(popupPosition.x, window.innerWidth - 400),
                        top: isMobile ? 'auto' : popupPosition.y,
                        bottom: isMobile ? '100px' : 'auto',
                        transform: isMobile ? 'translateX(-50%)' : 'translate(-50%, -100%)',
                    }}
                >
                    {!explanation ? (
                        <div className="p-3">
                            <p className="text-xs text-gray-500 dark:text-white/50 mb-2 truncate">
                                "{selectedText.slice(0, 50)}{selectedText.length > 50 ? '...' : ''}"
                            </p>
                            <div className="flex gap-2 flex-wrap">
                                <button onClick={() => handleExplain('explain')} disabled={isExplaining} className="px-3 py-1.5 text-sm bg-green-600 dark:bg-[#00A400] text-white rounded-lg disabled:opacity-50">
                                    {isExplaining && explainType === 'explain' ? '...' : 'Explain'}
                                </button>
                                <button onClick={() => handleExplain('example')} disabled={isExplaining} className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white rounded-lg disabled:opacity-50">
                                    {isExplaining && explainType === 'example' ? '...' : 'Example'}
                                </button>
                                <button onClick={() => handleExplain('remember')} disabled={isExplaining} className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white rounded-lg disabled:opacity-50">
                                    {isExplaining && explainType === 'remember' ? '...' : 'Memory Aid'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 max-h-60 overflow-y-auto">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-medium text-green-600 dark:text-green-400 uppercase">{explainType}</span>
                                <button onClick={closeExplainPopup} className="p-1 hover:bg-gray-100 dark:hover:bg-white/5 rounded">
                                    <XMarkIcon className="h-4 w-4 text-gray-700 dark:text-white" />
                                </button>
                            </div>
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                                <MarkdownWithMath content={explanation} role="model" />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Onboarding Tutorial Modal */}
            {showTutorial && (
                <>
                    <div className="fixed inset-0 bg-black/70 z-50" onClick={dismissTutorial} />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-[#1a2a1a] rounded-2xl w-full shadow-2xl overflow-hidden relative" style={{ maxWidth: '400px' }}>
                            {/* Close Button */}
                            <button
                                onClick={dismissTutorial}
                                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:text-white/40 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                            >
                                <XMarkIcon className="h-5 w-5" />
                            </button>

                            {/* Header */}
                            <div className="px-6 pt-6 pb-4 text-center">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                    How to Study
                                </h2>
                                <p className="text-gray-500 dark:text-white/60 text-sm">
                                    Get explanations for anything you don't understand
                                </p>
                            </div>

                            {/* Steps */}
                            <div className="px-6 pb-6 space-y-4">
                                {/* Step 1 */}
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-7 h-7 bg-green-600 dark:bg-[#00A400] text-white rounded-full flex items-center justify-center text-sm font-bold">
                                        1
                                    </div>
                                    <div className="flex-1 pt-0.5">
                                        <p className="text-gray-900 dark:text-white font-medium">
                                            Select any text you find confusing
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-white/50 mt-0.5">
                                            Just highlight it with your finger or cursor
                                        </p>
                                    </div>
                                </div>

                                {/* Step 2 */}
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-7 h-7 bg-green-600 dark:bg-[#00A400] text-white rounded-full flex items-center justify-center text-sm font-bold">
                                        2
                                    </div>
                                    <div className="flex-1 pt-0.5">
                                        <p className="text-gray-900 dark:text-white font-medium">
                                            Tap "Explain" or "Example"
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-white/50 mt-0.5">
                                            A popup will appear with options
                                        </p>
                                    </div>
                                </div>

                                {/* Step 3 */}
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-7 h-7 bg-green-600 dark:bg-[#00A400] text-white rounded-full flex items-center justify-center text-sm font-bold">
                                        3
                                    </div>
                                    <div className="flex-1 pt-0.5">
                                        <p className="text-gray-900 dark:text-white font-medium">
                                            Get instant AI explanations
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-white/50 mt-0.5">
                                            Simple answers tailored to your course
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Tip */}
                            <div className="mx-6 mb-6 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800/30">
                                <p className="text-sm text-green-800 dark:text-green-300 text-center">
                                    <span className="font-medium">Tip:</span> Use the chat for follow-up questions
                                </p>
                            </div>

                            {/* Button */}
                            <div className="px-6 pb-6">
                                <button
                                    onClick={dismissTutorial}
                                    className="w-full py-3.5 bg-green-600 dark:bg-[#00A400] text-white font-semibold rounded-xl hover:bg-green-700 dark:hover:bg-[#008300] transition-colors text-base"
                                >
                                    Start Reading
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
