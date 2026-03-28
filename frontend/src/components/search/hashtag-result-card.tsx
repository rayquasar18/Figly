'use client';

import Link from 'next/link';
import { Hash } from 'lucide-react';
import type { SearchHashtagResult } from '@figly/shared';

interface HashtagResultCardProps {
  hashtag: SearchHashtagResult;
}

export function HashtagResultCard({ hashtag }: HashtagResultCardProps) {
  return (
    <Link
      href={`/hashtag/${hashtag.name}`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors"
    >
      <div className="flex size-8 items-center justify-center rounded-full bg-muted">
        <Hash className="size-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold truncate">#{hashtag.name}</p>
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {hashtag.postCount} bai viet
      </span>
    </Link>
  );
}
