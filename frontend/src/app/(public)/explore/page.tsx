'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { usePublicFeed } from '@/hooks/queries/post-queries';
import { useExploreFeed } from '@/hooks/queries/search-queries';
import { PostCard } from '@/components/post/post-card';
import { FeedSkeleton } from '@/components/feed/feed-skeleton';
import { PostDetailModal } from '@/components/post/post-detail-modal';
import { ExploreCategorySectionComponent } from '@/components/search/explore-category-section';
import { Skeleton } from '@/components/ui/skeleton';

export default function ExplorePage() {
  const { data: exploreSections, isLoading: isExploreLoading } =
    useExploreFeed();
  const {
    data: publicFeedData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isPublicLoading,
  } = usePublicFeed();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  // Infinite scroll for the "Moi nhat" section
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

  const isLoading = isExploreLoading && isPublicLoading;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[470px] pb-16">
        <div className="px-4 py-6">
          <h1 className="text-xl font-bold">Kham pha</h1>
        </div>
        {/* Category sections skeleton */}
        <ExploreSkeleton />
        <FeedSkeleton />
      </div>
    );
  }

  const publicPosts = publicFeedData?.pages.flatMap((page) => page.items) ?? [];
  const hasSections =
    exploreSections && exploreSections.length > 0;

  return (
    <div className="mx-auto max-w-[470px] pb-16">
      <div className="px-4 py-6">
        <h1 className="text-xl font-bold">Kham pha</h1>
      </div>

      {/* Category-curated sections */}
      {isExploreLoading ? (
        <ExploreSkeleton />
      ) : hasSections ? (
        <div className="mb-6">
          {exploreSections.map((section) => (
            <ExploreCategorySectionComponent
              key={section.category.id}
              section={section}
              onOpenPost={handleOpenDetail}
            />
          ))}
        </div>
      ) : null}

      {/* "Moi nhat" (Latest) section */}
      <div className="px-4 pb-3">
        <h2 className="text-lg font-bold">Moi nhat</h2>
      </div>

      {isPublicLoading ? (
        <FeedSkeleton />
      ) : publicPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-muted-foreground">Chua co bai viet nao</p>
        </div>
      ) : (
        <div className="space-y-0">
          {publicPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onOpenDetail={handleOpenDetail}
            />
          ))}

          {/* Sentinel for infinite scroll */}
          <div ref={sentinelRef} className="h-px" />

          {isFetchingNextPage && (
            <div className="flex justify-center py-6">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      )}

      {/* Post detail modal for desktop */}
      <PostDetailModal
        postId={selectedPostId}
        open={!!selectedPostId}
        onClose={() => setSelectedPostId(null)}
      />
    </div>
  );
}

/** Skeleton for category sections (3 rows of 3 squares) */
function ExploreSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i}>
          <div className="flex items-center justify-between px-4 mb-2">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="grid grid-cols-3 gap-0.5">
            {Array.from({ length: 3 }).map((_, j) => (
              <Skeleton key={j} className="aspect-square w-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
