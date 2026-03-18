/**
 * XSS Sanitization Utility
 * 
 * Provides HTML sanitization to prevent XSS attacks while allowing
 * safe HTML tags for content editing.
 */

// Allowed HTML tags for content
const ALLOWED_TAGS = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'span', 'div', 'li', 'blockquote', 'ul', 'ol',
  'strong', 'em', 'b', 'i', 'u', 's', 'code', 'pre',
  'br', 'hr', 'a', 'img', 'figure', 'figcaption',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'sub', 'sup', 'small', 'mark', 'del', 'ins'
];

// Allowed attributes per tag
const ALLOWED_ATTRS: Record<string, string[]> = {
  'a': ['href', 'title', 'target', 'rel'],
  'img': ['src', 'alt', 'title', 'width', 'height'],
  'td': ['colspan', 'rowspan'],
  'th': ['colspan', 'rowspan', 'scope'],
  '*': ['class', 'id', 'title', 'lang', 'dir']
};

// Dangerous patterns to strip
const DANGEROUS_PATTERNS = [
  // Event handlers
  /\s*on\w+\s*=\s*["'][^"']*["']/gi,
  /\s*on\w+\s*=\s*[^\s>]+/gi,
  // JavaScript protocol
  /javascript\s*:/gi,
  // Data URLs with javascript
  /data\s*:\s*text\/html/gi,
  // VBScript
  /vbscript\s*:/gi,
  // Expression (IE)
  /expression\s*\(/gi,
  // URL with javascript
  /url\s*\(\s*["']?\s*javascript:/gi,
];

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param html - The HTML string to sanitize
 * @returns Sanitized HTML string
 */
export function sanitizeContent(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  let sanitized = html;

  // First, remove dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }

  // Create a temporary DOM element for parsing
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = sanitized;

  // Recursively sanitize all elements
  sanitizeNode(tempDiv);

  // Get the sanitized HTML
  sanitized = tempDiv.innerHTML;

  return sanitized;
}

/**
 * Recursively sanitize a DOM node and its children
 */
function sanitizeNode(node: Node): void {
  const nodesToRemove: Node[] = [];

  node.childNodes.forEach((child) => {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const element = child as Element;
      const tagName = element.tagName.toLowerCase();

      // Remove disallowed tags but keep their content
      if (!ALLOWED_TAGS.includes(tagName)) {
        // Move children up and mark parent for removal
        while (element.firstChild) {
          node.insertBefore(element.firstChild, child);
        }
        nodesToRemove.push(child);
      } else {
        // Sanitize allowed element's attributes
        sanitizeAttributes(element, tagName);
        
        // Recursively sanitize children
        sanitizeNode(child);
      }
    }
  });

  // Remove nodes after iteration
  nodesToRemove.forEach((nodeToRemove) => {
    node.removeChild(nodeToRemove);
  });
}

/**
 * Sanitize attributes of an element
 */
function sanitizeAttributes(element: Element, tagName: string): void {
  const allowedAttrs = ALLOWED_ATTRS[tagName] || ALLOWED_ATTRS['*'] || [];
  const attrsToRemove: string[] = [];

  // Check each attribute
  Array.from(element.attributes).forEach((attr) => {
    const attrName = attr.name.toLowerCase();
    const attrValue = attr.value;

    // Check if attribute is allowed
    if (!allowedAttrs.includes(attrName)) {
      attrsToRemove.push(attrName);
      return;
    }

    // Special handling for href/src attributes
    if (attrName === 'href' || attrName === 'src') {
      // Check for dangerous protocols
      const lowerValue = attrValue.toLowerCase().trim();
      if (
        lowerValue.startsWith('javascript:') ||
        lowerValue.startsWith('vbscript:') ||
        lowerValue.startsWith('data:')
      ) {
        attrsToRemove.push(attrName);
        return;
      }
    }
  });

  // Remove disallowed attributes
  attrsToRemove.forEach((attrName) => {
    element.removeAttribute(attrName);
  });
}

/**
 * Strip all HTML tags and return plain text
 * @param html - The HTML string to strip
 * @returns Plain text string
 */
export function stripHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  return tempDiv.textContent || tempDiv.innerText || '';
}

/**
 * Validate that a string contains only allowed HTML
 * @param html - The HTML string to validate
 * @returns true if the HTML is valid/safe
 */
export function isValidHtml(html: string): boolean {
  if (!html || typeof html !== 'string') {
    return false;
  }

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  let isValid = true;

  tempDiv.querySelectorAll('*').forEach((element) => {
    const tagName = element.tagName.toLowerCase();
    if (!ALLOWED_TAGS.includes(tagName)) {
      isValid = false;
    }
  });

  return isValid;
}

/**
 * Escape HTML special characters to prevent XSS
 * @param text - The text to escape
 * @returns Escaped HTML string
 */
export function escapeHtml(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  const map: Record<string, string> = {
    '&': '&',
    '<': '<',
    '>': '>',
    '"': '"',
    "'": '&#x27;',
    '/': '&#x2F;'
  };

  return text.replace(/[&<>"'/]/g, (m) => map[m]);
}

/**
 * Unescape HTML entities back to regular characters
 * @param html - The escaped HTML string
 * @returns Unescaped text string
 */
export function unescapeHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  const map: Record<string, string> = {
    '&': '&',
    '<': '<',
    '>': '>',
    '"': '"',
    '&#x27;': "'",
    '&#x2F;': '/',
    '&#39;': "'",
    '&nbsp;': ' '
  };

  return html.replace(/&(amp|lt|gt|quot|#x27|#x2F|#39|nbsp);/g, (m) => map[m]);
}
