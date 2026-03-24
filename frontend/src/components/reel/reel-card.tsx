'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Volume2, VolumeX, Play, Pause, Heart } from 'lucide-react';
import { ReelActions } from './reel-actions';
import { ReelAuthorInfo } from './reel-author-info';
import { ReelCommentsSheet } from './reel-comments-sheet';
import { useLikeMutation } from '@/hooks/queries/interaction-queries';
import type { PostResponse } from '@figly/shared';

interface ReelCardProps {
  reel: PostResponse;
  isActive: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  shouldLoad: boolean;
}

export function ReelCard({
  reel,
  isActive,
  isMuted,
  onToggleMute,
  shouldLoad,
}: ReelCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [showPlayPause, setShowPlayPause] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const [heartPos, setHeartPos] = useState({ x: 0, y: 0 });
  const lastTapRef = useRef(0);
  const playPauseTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const heartTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const likeMutation = useLikeMutation();

  const videoSrc = reel.media[0]?.url;

  // Auto-play/pause based on isActive
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      video.play().catch(() => {});
      setIsPaused(false);
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [isActive]);

  // Mute control
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = isMuted;
    }
  }, [isMuted]);

  // Memory management: remove src when far away
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (shouldLoad && videoSrc) {
      if (!video.src || video.src !== videoSrc) {
        video.src = videoSrc;
        video.load();
      }
    } else if (!shouldLoad) {
      video.removeAttribute('src');
      video.load();
    }
  }, [shouldLoad, videoSrc]);

  const handleTap = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const now = Date.now();
      const timeSinceLastTap = now - lastTapRef.current;

      if (timeSinceLastTap < 300) {
        // Double-tap: like
        const rect = e.currentTarget.getBoundingClientRect();
        setHeartPos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
        setShowHeart(true);
        if (heartTimerRef.current) clearTimeout(heartTimerRef.current);
        heartTimerRef.current = setTimeout(() => setShowHeart(false), 600);

        if (!reel.isLiked) {
          likeMutation.mutate({ postId: reel.id });
        }

        lastTapRef.current = 0;
        return;
      }

      lastTapRef.current = now;

      // Single tap: play/pause (debounced to avoid double-tap conflict)
      setTimeout(() => {
        if (lastTapRef.current !== now) return;

        const video = videoRef.current;
        if (!video) return;

        if (video.paused) {
          video.play().catch(() => {});
          setIsPaused(false);
        } else {
          video.pause();
          setIsPaused(true);
        }

        setShowPlayPause(true);
        if (playPauseTimerRef.current)
          clearTimeout(playPauseTimerRef.current);
        playPauseTimerRef.current = setTimeout(
          () => setShowPlayPause(false),
          500,
        );
      }, 300);
    },
    [reel.isLiked, reel.id, likeMutation],
  );

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (playPauseTimerRef.current) clearTimeout(playPauseTimerRef.current);
      if (heartTimerRef.current) clearTimeout(heartTimerRef.current);
    };
  }, []);

  return (
    <div className="relative h-full w-full bg-black">
      {/* Video */}
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-contain"
        loop
        muted={isMuted}
        playsInline
        preload={isActive ? 'auto' : 'metadata'}
      />

      {/* Tap area */}
      <div
        className="absolute inset-0 z-10"
        onClick={handleTap}
      />

      {/* Top gradient */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[15%] bg-gradient-to-b from-black/30 to-transparent" />

      {/* Bottom gradient */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[40%] bg-gradient-to-t from-black/60 to-transparent" />

      {/* Mute button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleMute();
        }}
        className="absolute right-3 top-4 z-20 flex size-9 items-center justify-center rounded-full bg-black/20"
        aria-label={isMuted ? 'Bat tieng' : 'Tat tieng'}
      >
        {isMuted ? (
          <VolumeX className="size-5 text-white/80" />
        ) : (
          <Volume2 className="size-5 text-white/80" />
        )}
      </button>

      {/* Play/Pause overlay */}
      <div
        className={`pointer-events-none absolute inset-0 z-20 flex items-center justify-center transition-opacity duration-500 ${
          showPlayPause ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="rounded-full bg-black/20 p-4">
          {isPaused ? (
            <Play className="size-12 text-white/80" />
          ) : (
            <Pause className="size-12 text-white/80" />
          )}
        </div>
      </div>

      {/* Double-tap heart animation */}
      {showHeart && (
        <div
          className="pointer-events-none absolute z-30 animate-ping"
          style={{
            left: heartPos.x - 30,
            top: heartPos.y - 30,
          }}
        >
          <Heart className="size-16 fill-red-500 text-red-500" />
        </div>
      )}

      {/* Actions (right side) */}
      <div className="z-20">
        <ReelActions
          reel={reel}
          onCommentClick={() => setCommentsOpen(true)}
        />
      </div>

      {/* Author info (bottom-left) */}
      <div className="z-20">
        <ReelAuthorInfo reel={reel} />
      </div>

      {/* Comments sheet */}
      <ReelCommentsSheet
        open={commentsOpen}
        onOpenChange={setCommentsOpen}
        postId={reel.id}
      />
    </div>
  );
}
