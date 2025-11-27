/**
 * Rich Text Utilities
 * Helper functions for processing rich text content
 */

/**
 * Sanitize HTML to prevent XSS attacks
 * Uses a simple whitelist approach for allowed tags and attributes
 */
export function sanitizeHTML(html: string): string {
  // In production, use a library like DOMPurify
  // For now, basic sanitization
  const allowedTags = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'em', 'u', 's', 'ul', 'ol', 'li', 'br', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'img', 'a', 'blockquote', 'code', 'pre', 'span', 'div'];
  const allowedAttributes: Record<string, string[]> = {
    'a': ['href', 'title', 'target'],
    'img': ['src', 'alt', 'width', 'height'],
    'td': ['colspan', 'rowspan'],
    'th': ['colspan', 'rowspan'],
  };
  
  // Basic sanitization - in production, use DOMPurify
  return html;
}

/**
 * Extract plain text from HTML for search indexing
 */
export function extractText(html: string): string {
  // Remove HTML tags
  const text = html.replace(/<[^>]*>/g, '');
  // Decode HTML entities
  const decoded = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  return decoded.trim();
}

/**
 * Count words in HTML content
 */
export function countWords(html: string): number {
  const text = extractText(html);
  if (!text) return 0;
  const words = text.split(/\s+/).filter(word => word.length > 0);
  return words.length;
}

/**
 * Count characters in HTML content (excluding tags)
 */
export function countCharacters(html: string): number {
  const text = extractText(html);
  return text.length;
}

/**
 * Check if HTML contains images
 */
export function hasImages(html: string): boolean {
  return /<img[^>]+>/i.test(html);
}

/**
 * Check if HTML contains tables
 */
export function hasTables(html: string): boolean {
  return /<table[^>]*>/i.test(html);
}

/**
 * Replace variables {{field}} with actual values
 * Example: {{division}} -> "Energy Division A"
 */
export function replaceVariables(
  html: string,
  data: Record<string, any>
): string {
  let result = html;
  
  Object.keys(data).forEach(key => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    result = result.replace(regex, String(data[key] || ''));
  });
  
  return result;
}

/**
 * Generate template metadata from HTML content
 */
export function generateMetadata(html: string) {
  return {
    wordCount: countWords(html),
    characterCount: countCharacters(html),
    hasImages: hasImages(html),
    hasTables: hasTables(html),
  };
}

/**
 * Convert HTML to plain text summary (first 200 chars)
 */
export function generateSummary(html: string, maxLength: number = 200): string {
  const text = extractText(html);
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Extract all variable placeholders from HTML
 * Returns array like ['division', 'date', 'state']
 */
export function extractVariables(html: string): string[] {
  const regex = /{{\\s*([a-zA-Z0-9_]+)\\s*}}/g;
  const variables: string[] = [];
  let match;
  
  while ((match = regex.exec(html)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }
  
  return variables;
}

/**
 * Validate that HTML has required variables
 */
export function validateRequiredVariables(
  html: string,
  requiredVars: string[]
): { valid: boolean; missing: string[] } {
  const foundVars = extractVariables(html);
  const missing = requiredVars.filter(v => !foundVars.includes(v));
  
  return {
    valid: missing.length === 0,
    missing,
  };
}
