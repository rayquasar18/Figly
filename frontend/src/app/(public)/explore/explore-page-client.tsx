'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { usePublicFeed, PostCard, PostDetailModal } from '@/features/post';
import { FeedSkeleton } from '@/features/feed';

export default function ExplorePageClient() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = usePublicFeed();
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
    if (window.innerWidth >= 768) {
      setSelectedPostId(postId);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[470px] pb-16">
        <div className="px-4 py-6">
          <h1 className="text-xl font-bold">Kham pha</h1>
        </div>
        <FeedSkeleton />
      </div>
    );
  }

  const items = data?.pages.flatMap((page) => page.items) ?? [];

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-[470px] pb-16">
        <div className="px-4 py-6">
          <h1 className="text-xl font-bold">Kham pha</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-muted-foreground">Chua co bai viet nao</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[470px] pb-16">
      <div className="px-4 py-6">
        <h1 className="text-xl font-bold">Kham pha</h1>
      </div>

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
    </div>
  );
}
