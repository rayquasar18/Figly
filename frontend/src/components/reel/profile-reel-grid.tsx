'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Play, Loader2 } from 'lucide-react';
import { useUserReels } from '@/hooks/queries/reel-queries';

interface ProfileReelGridProps {
  username: string;
}

export function ProfileReelGrid({ username }: ProfileReelGridProps) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useUserReels(username);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Infinite scroll
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

  const reels = data?.pages.flatMap((page) => page.items) ?? [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Chua co reel nao
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-0.5">
        {reels.map((reel) => {
          const thumbnailUrl = reel.reelMeta?.thumbnailUrl;

          return (
            <Link
              key={reel.id}
              href="/reels"
              className="group relative aspect-[9/16] overflow-hidden bg-muted"
            >
              {thumbnailUrl ? (
                <img
                  src={thumbnailUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/20" />
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <Play className="size-8 text-white/80" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-1" />

      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      )}
    </>
  );
}
