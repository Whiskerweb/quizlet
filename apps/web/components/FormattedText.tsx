import React from 'react';

interface FormattedTextProps {
  text: string;
  className?: string;
  as?: 'p' | 'div' | 'span' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export function FormattedText({ text, className = '', as = 'div' }: FormattedTextProps) {
  // Simple text rendering - preserves line breaks and whitespace
  const formattedText = text.split('\n').map((line, index, array) => (
    <React.Fragment key={index}>
      {line}
      {index < array.length - 1 && <br />}
    </React.Fragment>
  ));

  const Component = as;

  return <Component className={className}>{formattedText}</Component>;
}

