'use client';

import { useState } from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeEditorProps {
  code: string;
  onChange?: (code: string) => void;
  readOnly?: boolean;
  placeholder?: string;
}

export default function CodeEditor({ code, onChange, readOnly = false, placeholder }: CodeEditorProps) {
  const [isEditing, setIsEditing] = useState(false);

  if (readOnly) {
    return (
      <div className="h-full overflow-auto">
        <SyntaxHighlighter
          language="typescript"
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: '1.25rem',
            background: 'transparent',
            fontSize: '0.875rem',
            lineHeight: '1.5',
          }}
          showLineNumbers
          lineNumberStyle={{
            color: '#6b7280',
            paddingRight: '1rem',
            minWidth: '2.5rem',
          }}
        >
          {code || placeholder || '// Result will appear here...'}
        </SyntaxHighlighter>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      {isEditing ? (
        <textarea
          value={code}
          onChange={(e) => onChange?.(e.target.value)}
          onBlur={() => setIsEditing(false)}
          className="w-full h-full bg-transparent text-slate-300 p-5 font-mono text-sm resize-none focus:outline-none leading-relaxed selection:bg-blue-500/30 selection:text-white"
          placeholder={placeholder}
          spellCheck={false}
          autoFocus
        />
      ) : (
        <div 
          onClick={() => setIsEditing(true)}
          className="h-full overflow-auto cursor-text"
        >
          <SyntaxHighlighter
            language="typescript"
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              padding: '1.25rem',
              background: 'transparent',
              fontSize: '0.875rem',
              lineHeight: '1.5',
            }}
            showLineNumbers
            lineNumberStyle={{
              color: '#6b7280',
              paddingRight: '1rem',
              minWidth: '2.5rem',
            }}
          >
            {code || placeholder || '// Paste your code here...'}
          </SyntaxHighlighter>
        </div>
      )}
    </div>
  );
}
