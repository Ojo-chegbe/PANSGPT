// Utility functions for formatting AI responses with better structure

export interface FormattedResponse {
  content: string;
  hasCallouts: boolean;
  hasFormulas: boolean;
  hasLists: boolean;
  hasTables: boolean;
}

/**
 * Formats AI responses to include better structure and callout boxes
 */
export function formatAIResponse(content: string): FormattedResponse {
  let formatted = content;
  let hasCallouts = false;
  let hasFormulas = false;
  let hasLists = false;
  let hasTables = false;

  // Detect and format key concepts
  if (content.includes('Key Concept') || content.includes('key concept') || content.includes('Definition')) {
    formatted = formatted.replace(
      /(Key Concept|key concept|Definition)[:\s]*([^.\n]+[^.\n]*)/gi,
      '[KEY_CONCEPT]\n\n**$1:** $2\n\n'
    );
    hasCallouts = true;
  }

  // Detect and format examples
  if (content.includes('Example') || content.includes('example') || content.includes('For instance')) {
    formatted = formatted.replace(
      /(Example|example|For instance)[:\s]*([^.\n]+[^.\n]*)/gi,
      '[EXAMPLE]\n\n**$1:** $2\n\n'
    );
    hasCallouts = true;
  }

  // Detect and format important notes
  if (content.includes('Important') || content.includes('important') || content.includes('Note')) {
    formatted = formatted.replace(
      /(Important|important|Note)[:\s]*([^.\n]+[^.\n]*)/gi,
      '[IMPORTANT]\n\n**$1:** $2\n\n'
    );
    hasCallouts = true;
  }

  // Detect and format warnings
  if (content.includes('Warning') || content.includes('warning') || content.includes('Caution')) {
    formatted = formatted.replace(
      /(Warning|warning|Caution)[:\s]*([^.\n]+[^.\n]*)/gi,
      '[WARNING]\n\n**$1:** $2\n\n'
    );
    hasCallouts = true;
  }

  // Detect and format formulas
  if (content.includes('Formula') || content.includes('formula') || content.includes('=')) {
    formatted = formatted.replace(
      /(Formula|formula)[:\s]*([^.\n]+[^.\n]*)/gi,
      '[FORMULA]\n\n**$1:** $2\n\n'
    );
    hasFormulas = true;
  }

  // Detect numbered lists and improve formatting
  if (/\d+\.\s/.test(content)) {
    formatted = formatted.replace(/(\d+\.\s)/g, '\n$1');
    hasLists = true;
  }

  // Detect bullet points and improve formatting
  if (/[\-\*]\s/.test(content)) {
    formatted = formatted.replace(/([\-\*]\s)/g, '\n$1');
    hasLists = true;
  }

  // Detect and format tables
  if (/\|.*\|/.test(content)) {
    formatted = formatTables(formatted);
    hasTables = true;
  }

  // Add better paragraph spacing
  formatted = formatted.replace(/\n\n/g, '\n\n\n');

  // Clean up multiple newlines
  formatted = formatted.replace(/\n{4,}/g, '\n\n\n');

  return {
    content: formatted,
    hasCallouts,
    hasFormulas,
    hasLists,
    hasTables
  };
}

/**
 * Detects if content contains mathematical formulas
 */
export function containsMath(content: string): boolean {
  return /\$[^$]+\$|\$\$[^$]+\$\$/.test(content);
}

/**
 * Detects if content contains lists
 */
export function containsLists(content: string): boolean {
  return /\d+\.\s|[\-\*]\s/.test(content);
}

/**
 * Detects if content contains callout-worthy sections
 */
export function containsCallouts(content: string): boolean {
  const calloutKeywords = [
    'key concept', 'definition', 'example', 'for instance',
    'important', 'note', 'warning', 'caution', 'formula'
  ];
  
  return calloutKeywords.some(keyword => 
    content.toLowerCase().includes(keyword)
  );
}

/**
 * Detects if content contains tables
 */
export function containsTables(content: string): boolean {
  return /\|.*\|/.test(content);
}

/**
 * Formats markdown tables with better structure and styling
 */
function formatTables(content: string): string {
  // Find all table blocks
  const tableRegex = /(\|.*\|(?:\n\|.*\|)*)/g;
  
  return content.replace(tableRegex, (tableBlock) => {
    const lines = tableBlock.trim().split('\n');
    if (lines.length < 2) return tableBlock;
    
    // Check if it's a proper markdown table
    const hasHeaderSeparator = lines[1].includes('---') || lines[1].includes('===');
    if (!hasHeaderSeparator) return tableBlock;
    
    // Determine table type based on content
    const tableType = determineTableType(lines[0]);
    
    // Add wrapper div for responsive scrolling
    const wrappedTable = `<div class="table-wrapper">\n${tableBlock}\n</div>`;
    
    // Add table class based on type
    const tableWithClass = wrappedTable.replace(
      /<table>/g, 
      `<table class="${tableType}">`
    );
    
    return tableWithClass;
  });
}

/**
 * Determines the appropriate CSS class for a table based on its content
 */
function determineTableType(headerRow: string): string {
  const header = headerRow.toLowerCase();
  
  // Chemical/formula tables
  if (header.includes('substance') || header.includes('formula') || 
      header.includes('molar') || header.includes('equivalent') ||
      header.includes('molecule') || header.includes('compound')) {
    return 'formula-table';
  }
  
  // Comparison tables
  if (header.includes('vs') || header.includes('compare') || 
      header.includes('difference') || header.includes('versus')) {
    return 'comparison-table';
  }
  
  // Data tables
  if (header.includes('data') || header.includes('value') || 
      header.includes('result') || header.includes('measurement')) {
    return 'data-table';
  }
  
  // Default table
  return 'data-table';
}

/**
 * Formats a table with proper alignment and spacing
 */
function formatTableAlignment(tableContent: string): string {
  // This function can be extended to handle specific alignment requirements
  // For now, we'll return the content as-is since CSS handles most alignment
  return tableContent;
}
