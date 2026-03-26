'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Bookmark } from 'lucide-react';
import { useSavedPosts } from '@/hooks/queries/post-queries';
import { PostDetailModal } from '@/components/post/post-detail-modal';

export function SavedPageClient() {
  const router = useRouter();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useSavedPosts();
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

  const handlePostClick = useCallback(
    (postId: string) => {
      if (window.innerWidth >= 768) {
        setSelectedPostId(postId);
      } else {
        router.push(`/post/${postId}`);
      }
    },
    [router],
  );

  const items = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="mx-auto max-w-[935px] pb-16">
      {/* Header */}
      <div className="border-b p-4">
        <h1 className="text-lg font-semibold">Da luu</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex size-16 items-center justify-center rounded-full border-2 border-muted-foreground/30">
            <Bookmark className="size-8 text-muted-foreground/50" />
          </div>
          <p className="mt-4 text-lg font-semibold">Chua co bai viet nao duoc luu</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Luu bai viet ma ban muon xem lai sau.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-0.5 md:gap-1">
            {items.map((post) => (
              <button
                key={post.id}
                onClick={() => handlePostClick(post.id)}
                className="relative aspect-square overflow-hidden bg-muted"
                aria-label={`Xem bai viet ${post.id}`}
              >
                {post.media[0] ? (
                  <img
                    src={post.media[0].url}
                    alt=""
                    className="size-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center bg-muted">
                    <Bookmark className="size-8 text-muted-foreground/50" />
                  </div>
                )}
                {/* Multi-image indicator */}
                {post.media.length > 1 && (
                  <div className="absolute right-2 top-2">
                    <svg
                      className="size-5 text-white drop-shadow"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z" />
                      <path d="M3 5H1v16c0 1.1.9 2 2 2h16v-2H3V5z" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Sentinel for infinite scroll */}
          <div ref={sentinelRef} className="h-px" />

          {isFetchingNextPage && (
            <div className="flex justify-center py-6">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </>
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
