'use client';

import { useRef, useEffect, useState } from 'react';
import { Bold, Italic, Underline } from 'lucide-react';

interface RichTextEditorProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  disabled?: boolean;
}

export function RichTextEditor({
  id,
  value,
  onChange,
  placeholder = '',
  rows = 4,
  className = '',
  disabled = false,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [hasSelection, setHasSelection] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Convert stored format (with HTML tags like <b>text</b>) to displayable HTML
  const convertToHTML = (text: string): string => {
    if (!text) return '';
    // If text already contains HTML tags, return as is (but normalize)
    if (text.includes('<') && text.includes('>')) {
      // Normalize line breaks
      return text.replace(/\n/g, '<br>');
    }
    // Plain text - just convert line breaks
    return text.replace(/\n/g, '<br>');
  };

  // Convert HTML from contentEditable back to stored format
  const convertToStoredFormat = (html: string): string => {
    if (!html) return '';
    // Convert <br> to newlines, but keep other HTML tags
    let result = html.replace(/<br\s*\/?>/gi, '\n');
    // Remove empty paragraphs
    result = result.replace(/<p><\/p>/gi, '');
    result = result.replace(/<p>/gi, '');
    result = result.replace(/<\/p>/gi, '\n');
    // Clean up multiple newlines
    result = result.replace(/\n{3,}/g, '\n\n');
    return result.trim();
  };

  // Update editor content when value changes externally
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || isFocused) return; // Don't update while user is editing

    const htmlContent = convertToHTML(value);
    if (editor.innerHTML !== htmlContent) {
      editor.innerHTML = htmlContent || '';
    }
  }, [value, isFocused]);

  // Setup event listeners
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const handleInput = () => {
      if (editor) {
        const html = editor.innerHTML;
        const stored = convertToStoredFormat(html);
        onChange(stored);
      }
    };

    const handleSelectionChange = () => {
      if (!isFocused) return;
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        if (editor.contains(range.commonAncestorContainer)) {
          setHasSelection(!range.collapsed);
        } else {
          setHasSelection(false);
        }
      } else {
        setHasSelection(false);
      }
    };

    const handleFocus = () => {
      setIsFocused(true);
    };

    const handleBlur = () => {
      setIsFocused(false);
      setHasSelection(false);
      if (editor) {
        const html = editor.innerHTML;
        const stored = convertToStoredFormat(html);
        onChange(stored);
      }
    };

    editor.addEventListener('input', handleInput);
    editor.addEventListener('focus', handleFocus);
    editor.addEventListener('blur', handleBlur);
    document.addEventListener('selectionchange', handleSelectionChange);

    return () => {
      editor.removeEventListener('input', handleInput);
      editor.removeEventListener('focus', handleFocus);
      editor.removeEventListener('blur', handleBlur);
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [onChange, isFocused]);

  const applyFormat = (command: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.focus();
    
    // Use document.execCommand for formatting
    document.execCommand(command, false, undefined);
    
    // Trigger input event to update value
    const event = new Event('input', { bubbles: true });
    editor.dispatchEvent(event);
  };

  const minHeight = rows * 24; // Approximate line height

  return (
    <div className="relative">
      <div
        id={id}
        ref={editorRef}
        contentEditable={!disabled}
        suppressContentEditableWarning
        className={`
          w-full px-4 py-2 border border-border-subtle rounded-lg 
          bg-white
          focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary
          text-content-emphasis
          ${isFocused ? 'ring-2 ring-brand-primary' : ''}
          ${className}
        `}
        style={{ minHeight: `${minHeight}px` }}
        data-placeholder={placeholder}
      />
      <style jsx global>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9CA3AF;
          pointer-events: none;
        }
        [contenteditable] {
          outline: none;
          color: #1F2937;
        }
        [contenteditable]:focus {
          outline: none;
        }
        [contenteditable] b,
        [contenteditable] strong {
          font-weight: bold;
          color: #1F2937;
        }
        [contenteditable] i,
        [contenteditable] em {
          font-style: italic;
          color: #1F2937;
        }
        [contenteditable] u {
          text-decoration: underline;
          color: #1F2937;
        }
      `}</style>
      
      {/* Format Toolbar */}
      <div className="mt-2 flex items-center gap-1">
        <button
          type="button"
          onClick={() => applyFormat('bold')}
          disabled={!hasSelection || disabled}
          className={`p-1.5 rounded transition-colors ${
            hasSelection && !disabled
              ? 'text-content-emphasis hover:bg-bg-muted'
              : 'text-content-subtle cursor-not-allowed'
          }`}
          title="Bold (Ctrl+B)"
          onMouseDown={(e) => e.preventDefault()}
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => applyFormat('italic')}
          disabled={!hasSelection || disabled}
          className={`p-1.5 rounded transition-colors ${
            hasSelection && !disabled
              ? 'text-content-emphasis hover:bg-bg-muted'
              : 'text-content-subtle cursor-not-allowed'
          }`}
          title="Italic (Ctrl+I)"
          onMouseDown={(e) => e.preventDefault()}
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => applyFormat('underline')}
          disabled={!hasSelection || disabled}
          className={`p-1.5 rounded transition-colors ${
            hasSelection && !disabled
              ? 'text-content-emphasis hover:bg-bg-muted'
              : 'text-content-subtle cursor-not-allowed'
          }`}
          title="Underline (Ctrl+U)"
          onMouseDown={(e) => e.preventDefault()}
        >
          <Underline className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

