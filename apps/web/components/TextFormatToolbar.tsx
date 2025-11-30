'use client';

import { useState, useRef, useEffect } from 'react';
import { Bold, Italic, Underline } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface TextFormatToolbarProps {
  textareaId?: string;
  textareaRef?: React.RefObject<HTMLTextAreaElement>;
  onFormat?: (format: 'bold' | 'italic' | 'underline', newValue: string) => void;
}

export function TextFormatToolbar({ textareaId, textareaRef, onFormat }: TextFormatToolbarProps) {
  const [selection, setSelection] = useState<{ start: number; end: number; text: string } | null>(null);

  useEffect(() => {
    const textarea = textareaId 
      ? document.getElementById(textareaId) as HTMLTextAreaElement
      : textareaRef?.current;

    if (!textarea) return;

    const handleSelection = () => {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value.substring(start, end);
      
      if (start !== end && text.length > 0) {
        setSelection({ start, end, text });
      } else {
        setSelection(null);
      }
    };

    textarea.addEventListener('mouseup', handleSelection);
    textarea.addEventListener('keyup', handleSelection);
    textarea.addEventListener('select', handleSelection);

    return () => {
      textarea.removeEventListener('mouseup', handleSelection);
      textarea.removeEventListener('keyup', handleSelection);
      textarea.removeEventListener('select', handleSelection);
    };
  }, [textareaId, textareaRef]);

  const applyFormat = (format: 'bold' | 'italic' | 'underline') => {
    const textarea = textareaId 
      ? document.getElementById(textareaId) as HTMLTextAreaElement
      : textareaRef?.current;

    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);

    if (!selectedText) return;

    let formattedText = '';
    switch (format) {
      case 'bold':
        formattedText = `<b>${selectedText}</b>`;
        break;
      case 'italic':
        formattedText = `<i>${selectedText}</i>`;
        break;
      case 'underline':
        formattedText = `<u>${selectedText}</u>`;
        break;
    }

    const newValue = 
      textarea.value.substring(0, start) + 
      formattedText + 
      textarea.value.substring(end);

    if (onFormat) {
      onFormat(format, newValue);
      return;
    }

    // Update textarea value
    textarea.value = newValue;
    
    // Trigger onChange event for react-hook-form
    const event = new Event('input', { bubbles: true });
    textarea.dispatchEvent(event);

    // Also trigger change event
    const changeEvent = new Event('change', { bubbles: true });
    textarea.dispatchEvent(changeEvent);

    // Restore cursor position
    const newCursorPos = start + formattedText.length;
    setTimeout(() => {
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      textarea.focus();
    }, 0);
  };

  const hasSelection = selection !== null && selection.text.length > 0;

  return (
    <div className="flex items-center gap-1 p-1 bg-gray-50 rounded border border-gray-200">
      <button
        type="button"
        onClick={() => applyFormat('bold')}
        disabled={!hasSelection}
        className={`p-1.5 rounded transition-colors ${
          hasSelection
            ? 'text-gray-700 hover:bg-gray-200'
            : 'text-gray-300 cursor-not-allowed'
        }`}
        title="Bold (Ctrl+B)"
      >
        <Bold className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => applyFormat('italic')}
        disabled={!hasSelection}
        className={`p-1.5 rounded transition-colors ${
          hasSelection
            ? 'text-gray-700 hover:bg-gray-200'
            : 'text-gray-300 cursor-not-allowed'
        }`}
        title="Italic (Ctrl+I)"
      >
        <Italic className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => applyFormat('underline')}
        disabled={!hasSelection}
        className={`p-1.5 rounded transition-colors ${
          hasSelection
            ? 'text-gray-700 hover:bg-gray-200'
            : 'text-gray-300 cursor-not-allowed'
        }`}
        title="Underline (Ctrl+U)"
      >
        <Underline className="h-4 w-4" />
      </button>
    </div>
  );
}

