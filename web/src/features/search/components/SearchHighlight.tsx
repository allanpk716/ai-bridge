import React from 'react';

interface SearchHighlightProps {
  text: string;
  searchQuery: string;
}

export function SearchHighlight({ text, searchQuery }: SearchHighlightProps) {
  if (!searchQuery.trim()) {
    return <>{text}</>;
  }

  try {
    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return (
      <>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </>
    );
  } catch {
    // Fallback if regex fails
    return <>{text}</>;
  }
}
