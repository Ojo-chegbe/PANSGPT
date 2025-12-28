'use strict';

/**
 * Document Parsing Utility for Study Mode
 * Parses raw text content into structured sections for the Study Reader
 */

// Types for structured document content
export interface Paragraph {
    id: string;
    text: string;
    type: 'paragraph' | 'list' | 'definition' | 'note' | 'example';
}

export interface Section {
    id: string;
    title: string;
    level: number; // 1 = main heading, 2 = subheading, 3 = sub-subheading
    content: Paragraph[];
}

export interface StructuredDocument {
    sections: Section[];
    totalParagraphs: number;
    totalSections: number;
}

// Heading detection patterns
const HEADING_PATTERNS = {
    // ALL CAPS with 3+ words (highest priority)
    allCaps: /^[A-Z][A-Z\s]{5,}[A-Z]$/,

    // Numbered headings: "1.", "1.0", "1.1", "1.1.1"
    numbered: /^(\d+\.)+\s*\d*\.?\s+.+/,

    // Roman numerals: "I.", "II.", "III.", etc.
    romanNumeral: /^(I{1,3}|IV|VI{0,3}|IX|X{0,3})\.?\s+.+/i,

    // Chapter/Section/Unit prefix
    chapterPrefix: /^(chapter|section|unit|part|module)\s+\d*:?\s*.*/i,

    // Colon ending (short lines < 60 chars)
    colonEnding: /^.{3,59}:$/,
};

// List patterns
const LIST_PATTERNS = {
    dash: /^\s*[-–—]\s+.+/,
    bullet: /^\s*[•·∙]\s+.+/,
    asterisk: /^\s*\*\s+.+/,
    numberedList: /^\s*\d+[.)]\s+.+/,
    letteredList: /^\s*[a-zA-Z][.)]\s+.+/,
    parenthetical: /^\s*\([a-zA-Z0-9]+\)\s+.+/,
};

// Special content patterns
const SPECIAL_PATTERNS = {
    definition: /^([A-Za-z][^:]{2,40}):\s+.{10,}/,
    note: /^(note|nb|important|warning|caution):\s*.+/i,
    example: /^(example|e\.g\.|for example|for instance)[:,]?\s*.+/i,
};

/**
 * Generate a unique ID for sections/paragraphs
 */
function generateId(prefix: string, index: number): string {
    return `${prefix}-${index}-${Date.now().toString(36).slice(-4)}`;
}

/**
 * Check if a line is a heading and return its level
 */
function detectHeading(line: string, nextLine?: string): { isHeading: boolean; level: number } {
    const trimmed = line.trim();

    if (!trimmed || trimmed.length < 3) {
        return { isHeading: false, level: 0 };
    }

    // ALL CAPS (Level 1) - most reliable
    if (HEADING_PATTERNS.allCaps.test(trimmed) && trimmed.length > 10) {
        return { isHeading: true, level: 1 };
    }

    // Chapter/Section prefix (Level 1)
    if (HEADING_PATTERNS.chapterPrefix.test(trimmed)) {
        return { isHeading: true, level: 1 };
    }

    // Roman numerals (Level 1)
    if (HEADING_PATTERNS.romanNumeral.test(trimmed)) {
        return { isHeading: true, level: 1 };
    }

    // Numbered headings
    if (HEADING_PATTERNS.numbered.test(trimmed)) {
        const match = trimmed.match(/^([\d.]+)/);
        if (match) {
            const parts = match[1].split('.').filter(p => p);
            const level = Math.min(parts.length, 3);
            return { isHeading: true, level };
        }
    }

    // Colon ending (Level 2) - only if short and followed by content
    if (HEADING_PATTERNS.colonEnding.test(trimmed) && nextLine && nextLine.trim()) {
        return { isHeading: true, level: 2 };
    }

    return { isHeading: false, level: 0 };
}

/**
 * Detect the type of a paragraph/line
 */
function detectParagraphType(text: string): Paragraph['type'] {
    const trimmed = text.trim();

    // Check for list patterns
    for (const pattern of Object.values(LIST_PATTERNS)) {
        if (pattern.test(trimmed)) {
            return 'list';
        }
    }

    // Check for definition
    if (SPECIAL_PATTERNS.definition.test(trimmed)) {
        return 'definition';
    }

    // Check for note/warning
    if (SPECIAL_PATTERNS.note.test(trimmed)) {
        return 'note';
    }

    // Check for example
    if (SPECIAL_PATTERNS.example.test(trimmed)) {
        return 'example';
    }

    return 'paragraph';
}

/**
 * Clean and normalize text
 */
function normalizeText(text: string): string {
    return text
        .replace(/\r\n/g, '\n')  // Normalize line endings
        .replace(/\r/g, '\n')
        .replace(/\t/g, '  ')    // Replace tabs with spaces
        .replace(/\n{3,}/g, '\n\n')  // Max 2 consecutive newlines
        .trim();
}

/**
 * Check if a line is likely a page number or header/footer to ignore
 */
function isIgnorableLine(line: string): boolean {
    const trimmed = line.trim();

    // Standalone numbers (page numbers)
    if (/^\d{1,4}$/.test(trimmed)) {
        return true;
    }

    // Very short lines that aren't meaningful
    if (trimmed.length < 3 && !/^[A-Z]/.test(trimmed)) {
        return true;
    }

    return false;
}

/**
 * Group consecutive list items together
 */
function groupListItems(paragraphs: Paragraph[]): Paragraph[] {
    const result: Paragraph[] = [];
    let currentListItems: string[] = [];

    for (const para of paragraphs) {
        if (para.type === 'list') {
            currentListItems.push(para.text);
        } else {
            // Flush accumulated list items
            if (currentListItems.length > 0) {
                result.push({
                    id: generateId('list', result.length),
                    text: currentListItems.join('\n'),
                    type: 'list'
                });
                currentListItems = [];
            }
            result.push(para);
        }
    }

    // Don't forget remaining list items
    if (currentListItems.length > 0) {
        result.push({
            id: generateId('list', result.length),
            text: currentListItems.join('\n'),
            type: 'list'
        });
    }

    return result;
}

/**
 * Main parsing function
 */
export function parseDocumentContent(rawText: string): StructuredDocument {
    const normalized = normalizeText(rawText);
    const lines = normalized.split('\n');

    const sections: Section[] = [];
    let currentSection: Section | null = null;
    let currentParagraphLines: string[] = [];
    let paragraphIndex = 0;
    let sectionIndex = 0;

    // Helper to flush current paragraph to current section
    const flushParagraph = () => {
        if (currentParagraphLines.length === 0) return;

        const text = currentParagraphLines.join('\n').trim();
        if (!text) {
            currentParagraphLines = [];
            return;
        }

        const paragraph: Paragraph = {
            id: generateId('p', paragraphIndex++),
            text,
            type: detectParagraphType(text)
        };

        if (currentSection) {
            currentSection.content.push(paragraph);
        } else {
            // Create an "Introduction" section for orphan paragraphs
            currentSection = {
                id: generateId('sec', sectionIndex++),
                title: 'Introduction',
                level: 1,
                content: [paragraph]
            };
            sections.push(currentSection);
        }

        currentParagraphLines = [];
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const nextLine = lines[i + 1];
        const trimmedLine = line.trim();

        // Skip ignorable lines
        if (isIgnorableLine(line)) {
            continue;
        }

        // Empty line = paragraph break
        if (!trimmedLine) {
            flushParagraph();
            continue;
        }

        // Check if this is a heading
        const { isHeading, level } = detectHeading(trimmedLine, nextLine);

        if (isHeading) {
            // Flush any pending paragraph
            flushParagraph();

            // Remove common heading prefixes for cleaner title
            let title = trimmedLine
                .replace(/^(chapter|section|unit|part|module)\s+\d*:?\s*/i, '')
                .replace(/^[\d.]+\s*/, '')
                .replace(/^(I{1,3}|IV|VI{0,3}|IX|X{0,3})\.?\s+/i, '')
                .replace(/:$/, '')
                .trim();

            // Capitalize first letter if all caps
            if (title === title.toUpperCase() && title.length > 3) {
                title = title.charAt(0) + title.slice(1).toLowerCase();
            }

            // Create new section
            currentSection = {
                id: generateId('sec', sectionIndex++),
                title: title || trimmedLine,
                level,
                content: []
            };
            sections.push(currentSection);
        } else {
            // Regular content line
            currentParagraphLines.push(trimmedLine);
        }
    }

    // Flush any remaining paragraph
    flushParagraph();

    // Post-process: group list items
    for (const section of sections) {
        section.content = groupListItems(section.content);
    }

    // Calculate totals
    const totalParagraphs = sections.reduce((sum, s) => sum + s.content.length, 0);

    return {
        sections,
        totalParagraphs,
        totalSections: sections.length
    };
}

/**
 * Re-parse existing document content (for migration)
 */
export function migrateDocumentContent(content: string | null): StructuredDocument | null {
    if (!content) return null;
    return parseDocumentContent(content);
}
