'use client';

import { ReelFeed, ReelSkeleton, useReelsFeed } from '@/features/reel';

export function ReelsPageClient() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useReelsFeed();

  const reels = data?.pages.flatMap((p) => p.items) ?? [];

  if (isLoading) {
    return (
      <div className="h-[calc(100dvh-56px)] md:h-dvh">
        <ReelSkeleton />
      </div>
    );
  }

  return (
    <div className="h-[calc(100dvh-56px)] md:h-dvh">
      <ReelFeed
        reels={reels}
        fetchNextPage={fetchNextPage}
        hasNextPage={!!hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
      />
    </div>
  );
}
