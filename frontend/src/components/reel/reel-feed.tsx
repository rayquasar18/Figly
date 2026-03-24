'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Clapperboard, Plus } from 'lucide-react';
import { ReelCard } from './reel-card';
import { useCreateReelStore } from '@/stores/create-reel-store';
import { Button } from '@/components/ui/button';
import type { PostResponse } from '@figly/shared';

interface ReelFeedProps {
  reels: PostResponse[];
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
}

export function ReelFeed({
  reels,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
}: ReelFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const openCreateReel = useCreateReelStore((s) => s.open);

  // Track which reel is visible via IntersectionObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reelElements = container.querySelectorAll('[data-reel-index]');
    if (!reelElements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const index = Number(
              (entry.target as HTMLElement).dataset.reelIndex,
            );
            if (!isNaN(index)) {
              setActiveIndex(index);
            }
          }
        }
      },
      { threshold: 0.7 },
    );

    reelElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [reels.length]);

  // Infinite scroll sentinel
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

  // Keyboard shortcuts (desktop)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        // Toggle play/pause on active reel's video
        const container = containerRef.current;
        if (!container) return;
        const activeEl = container.querySelector(
          `[data-reel-index="${activeIndex}"]`,
        );
        const video = activeEl?.querySelector('video');
        if (video) {
          if (video.paused) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        }
      }

      if (e.key === 'm' || e.key === 'M') {
        setIsMuted((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex]);

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  // Empty state
  if (reels.length === 0) {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center bg-black px-6 text-center">
        <Clapperboard className="mb-4 size-16 text-muted" />
        <h2 className="text-xl font-semibold text-white">
          Chua co reel nao
        </h2>
        <p className="mt-2 max-w-sm text-sm text-white/70">
          Hay la nguoi dau tien chia se reel! Quay video va chia se voi cong
          dong.
        </p>
        <Button
          onClick={openCreateReel}
          className="mt-6"
        >
          Tao reel dau tien
        </Button>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Create reel FAB */}
      <button
        onClick={openCreateReel}
        className="fixed bottom-20 right-4 z-30 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg md:bottom-8"
        aria-label="Tao reel"
      >
        <Plus className="size-6" />
      </button>

      <div
        ref={containerRef}
        className="mx-auto h-[100dvh] max-w-[470px] snap-y snap-mandatory overflow-y-scroll"
        style={{ scrollbarWidth: 'none' }}
        role="feed"
        aria-label="Reels"
      >
        {reels.map((reel, index) => (
          <div
            key={reel.id}
            data-reel-index={index}
            className="h-[100dvh] snap-start"
            role="article"
            aria-label={`Reel cua ${reel.author.username ?? ''}`}
          >
            <ReelCard
              reel={reel}
              isActive={index === activeIndex}
              isMuted={isMuted}
              onToggleMute={handleToggleMute}
              shouldLoad={
                index >= activeIndex - 1 && index <= activeIndex + 1
              }
            />
          </div>
        ))}

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="h-1" />
      </div>
    </div>
  );
}
