'use client';

import { useMemo } from 'react';

interface FormattedTextProps {
  text: string;
  className?: string;
  as?: 'p' | 'div' | 'span';
}

/**
 * Component to safely render HTML formatted text (bold, italic, underline)
 * Converts HTML tags to rendered format
 */
export function FormattedText({ text, className = '', as: Component = 'div' }: FormattedTextProps) {
  const formattedHTML = useMemo(() => {
    if (!text) return '';
    
    // If text doesn't contain HTML tags, return as is
    if (!text.includes('<') || !text.includes('>')) {
      return text;
    }

    // Sanitize: only allow safe HTML tags (b, i, u, strong, em)
    let sanitized = text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ''); // Remove styles

    // Convert newlines to <br> if not already HTML
    if (!sanitized.includes('<br')) {
      sanitized = sanitized.replace(/\n/g, '<br>');
    }

    return sanitized;
  }, [text]);

  return (
    <Component
      className={className}
      dangerouslySetInnerHTML={{ __html: formattedHTML }}
    />
  );
}

