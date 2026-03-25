'use client';

import { FeedList } from '@/features/feed';

export function FeedPageClient() {
  return (
    <div className="mx-auto max-w-[470px] pb-16">
      <FeedList />
    </div>
  );
}
