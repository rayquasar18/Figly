'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Hash, Loader2 } from 'lucide-react';
import { useHashtagPosts } from '@/hooks/queries/search-queries';
import { PostCard } from '@/components/post/post-card';
import { FeedSkeleton } from '@/components/feed/feed-skeleton';
import { PostDetailModal } from '@/components/post/post-detail-modal';

export default function HashtagPage() {
  const { name } = useParams<{ name: string }>();
  const decodedName = decodeURIComponent(name);
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, error } =
    useHashtagPosts(decodedName);
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
        <div className="flex items-center gap-2 px-4 py-6">
          <Hash className="size-6 text-muted-foreground" />
          <h1 className="text-xl font-bold">#{decodedName}</h1>
        </div>
        <FeedSkeleton />
      </div>
    );
  }

  // Handle 404 / error state
  if (isError) {
    const is404 = (error as any)?.response?.status === 404;
    return (
      <div className="mx-auto max-w-[470px] pb-16">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Hash className="size-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            {is404 ? 'Hashtag khong ton tai' : 'Da xay ra loi'}
          </p>
        </div>
      </div>
    );
  }

  const hashtag = data?.pages[0]?.hashtag;
  const posts = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="mx-auto max-w-[470px] pb-16">
      {/* Hashtag header */}
      <div className="px-4 py-6">
        <div className="flex items-center gap-2">
          <Hash className="size-6 text-muted-foreground" />
          <h1 className="text-xl font-bold">#{decodedName}</h1>
        </div>
        {hashtag && (
          <p className="mt-1 text-sm text-muted-foreground">
            {hashtag.postCount} bai viet
          </p>
        )}
      </div>

      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-muted-foreground">Chua co bai viet nao</p>
        </div>
      ) : (
        <div className="space-y-0">
          {posts.map((post) => (
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
