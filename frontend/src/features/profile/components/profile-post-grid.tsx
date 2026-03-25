'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Loader2 } from 'lucide-react';
import { useUserPosts, PostDetailModal } from '@/features/post';

interface ProfilePostGridProps {
  username: string;
}

export function ProfilePostGrid({ username }: ProfilePostGridProps) {
  const router = useRouter();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useUserPosts(username);
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

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const items = data?.pages.flatMap((page) => page.items) ?? [];

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex size-16 items-center justify-center rounded-full border-2 border-muted-foreground/30">
          <Camera className="size-8 text-muted-foreground/50" />
        </div>
        <p className="mt-4 text-lg font-semibold">Chua co bai viet nao</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Khi chia se anh, anh se xuat hien tren trang ca nhan cua ban.
        </p>
      </div>
    );
  }

  return (
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
                <Camera className="size-6 text-muted-foreground/50" />
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
        <div className="flex justify-center py-4">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Post detail modal for desktop */}
      <PostDetailModal
        postId={selectedPostId}
        open={!!selectedPostId}
        onClose={() => setSelectedPostId(null)}
      />
    </>
  );
}
