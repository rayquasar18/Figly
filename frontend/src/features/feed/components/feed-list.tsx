'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { useFeed } from '@/features/post';
import { PostCard, PostDetailModal } from '@/features/post';
import { FeedSkeleton } from './feed-skeleton';
import { EmptyFeed } from './empty-feed';

export function FeedList() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useFeed();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleOpenDetail = useCallback((postId: string) => {
    // Desktop: open modal. Mobile: handled by PostCard itself (router.push)
    if (window.innerWidth >= 768) {
      setSelectedPostId(postId);
    }
  }, []);

  if (isLoading) {
    return <FeedSkeleton />;
  }

  const items = data?.pages.flatMap((page) => page.items) ?? [];

  if (items.length === 0) {
    return <EmptyFeed />;
  }

  return (
    <>
      <div className="space-y-0">
        {items.map((post) => (
          <PostCard key={post.id} post={post} onOpenDetail={handleOpenDetail} />
        ))}

        {/* Sentinel for infinite scroll */}
        <div ref={sentinelRef} className="h-px" />

        {isFetchingNextPage && (
          <div className="flex justify-center py-6">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Post detail modal for desktop */}
      <PostDetailModal
        postId={selectedPostId}
        open={!!selectedPostId}
        onClose={() => setSelectedPostId(null)}
      />
    </>
  );
}
