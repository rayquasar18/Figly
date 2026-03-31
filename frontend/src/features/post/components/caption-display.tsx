'use client';

import { useState, Fragment } from 'react';
import Link from 'next/link';

interface CaptionDisplayProps {
  caption: string | null;
  username: string;
  truncate?: boolean;
}

/** Parse caption text and replace #hashtags and @mentions with links */
function parseCaption(text: string) {
  // Match hashtags and @mentions with Unicode support
  const regex = /(#[\p{L}\p{N}_]+|@[\p{L}\p{N}_]+)/gu;
  const parts: Array<{ type: 'text' | 'hashtag' | 'mention'; value: string }> = [];
  let lastIndex = 0;

  for (const match of text.matchAll(regex)) {
    const matchIndex = match.index!;
    if (matchIndex > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, matchIndex) });
    }

    if (match[0].startsWith('#')) {
      parts.push({ type: 'hashtag', value: match[0] });
    } else {
      parts.push({ type: 'mention', value: match[0] });
    }

    lastIndex = matchIndex + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return parts;
}

const TRUNCATE_LENGTH = 125;

export function CaptionDisplay({ caption, username, truncate = false }: CaptionDisplayProps) {
  const [expanded, setExpanded] = useState(false);

  if (!caption) return null;

  const shouldTruncate = truncate && !expanded && caption.length > TRUNCATE_LENGTH;
  const displayText = shouldTruncate ? caption.slice(0, TRUNCATE_LENGTH) : caption;
  const parts = parseCaption(displayText);

  return (
    <div className="text-sm">
      <Link href={`/${username}`} className="mr-1 font-semibold hover:underline">
        {username}
      </Link>
      {parts.map((part, i) => (
        <Fragment key={i}>
          {part.type === 'hashtag' ? (
            <Link href={`/hashtag/${part.value.slice(1)}`} className="text-primary hover:underline">
              {part.value}
            </Link>
          ) : part.type === 'mention' ? (
            <Link href={`/${part.value.slice(1)}`} className="text-primary hover:underline">
              {part.value}
            </Link>
          ) : (
            <span>{part.value}</span>
          )}
        </Fragment>
      ))}
      {shouldTruncate && (
        <button
          onClick={() => setExpanded(true)}
          className="ml-1 text-muted-foreground hover:text-foreground"
        >
          ...xem them
        </button>
      )}
    </div>
  );
}
