'use client';

import { useReelsFeed } from '@/hooks/queries/reel-queries';
import { ReelFeed } from '@/components/reel/reel-feed';
import { ReelSkeleton } from '@/components/reel/reel-skeleton';

export default function ReelsPage() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useReelsFeed();

  if (isLoading) return <ReelSkeleton />;

  const reels = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <ReelFeed
      reels={reels}
      fetchNextPage={fetchNextPage}
      hasNextPage={!!hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
    />
  );
}
