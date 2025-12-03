import { marked } from 'marked';
import DOMPurify from 'dompurify';

class MarkdownService {
  constructor() {
    // Configure marked for better compatibility (e.g., line breaks)
    marked.setOptions({
      breaks: true, // Render <br> for single line breaks
      gfm: true, // Use GitHub Flavored Markdown
      async: false, // Use synchronous parsing
    });
  }

  parse(markdown: string): string {
    if (!markdown) return '';
    try {
        const rawHtml = marked.parse(markdown) as string;
        // Sanitize the HTML to prevent XSS attacks
        const sanitizedHtml = DOMPurify.sanitize(rawHtml);
        return sanitizedHtml;
    } catch(e) {
        console.error("Markdown parsing failed", e);
        return markdown; // return original text on error
    }
  }
}

export const markdownService = new MarkdownService();
