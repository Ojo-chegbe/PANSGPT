/**
 * Generates a conversation title from the first user message
 * @param firstMessage - The first message content from the user
 * @returns A generated title for the conversation
 */
export function generateConversationTitle(firstMessage: string): string {
  if (!firstMessage || firstMessage.trim().length === 0) {
    return "New Conversation";
  }

  // Clean the message - remove extra whitespace and normalize
  const cleanMessage = firstMessage.trim();
  
  // If message is too short, use it as is
  if (cleanMessage.length <= 30) {
    return cleanMessage;
  }

  // Extract key phrases and words
  const words = cleanMessage.split(/\s+/);
  
  // Remove common stop words and short words
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must', 'shall',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
    'this', 'that', 'these', 'those', 'what', 'when', 'where', 'why', 'how', 'who',
    'please', 'thanks', 'thank', 'hello', 'hi', 'hey'
  ]);

  // Filter out stop words and short words, keep important terms
  const importantWords = words
    .filter(word => {
      const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
      return cleanWord.length > 2 && !stopWords.has(cleanWord);
    })
    .slice(0, 8); // Take first 8 important words

  // If we have important words, create title
  if (importantWords.length > 0) {
    let title = importantWords.join(' ');
    
    // Capitalize first letter of each word for better readability
    title = title.replace(/\b\w/g, l => l.toUpperCase());
    
    // Truncate if still too long
    if (title.length > 50) {
      title = title.substring(0, 47) + '...';
    }
    
    return title;
  }

  // Fallback: take first 30 characters and add ellipsis if needed
  if (cleanMessage.length > 30) {
    return cleanMessage.substring(0, 27) + '...';
  }

  return cleanMessage;
}

/**
 * Checks if a conversation title is the default "New Conversation"
 * @param title - The conversation title to check
 * @returns True if it's the default title
 */
export function isDefaultTitle(title: string): boolean {
  return title === "New Conversation" || title === "Conversation";
}
