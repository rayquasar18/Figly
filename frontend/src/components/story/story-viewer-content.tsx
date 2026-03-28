'use client';

import { useEffect, useRef } from 'react';

interface StoryViewerContentProps {
  story: {
    media: { url: string; type: 'image' | 'video'; thumbnailUrl?: string }[];
  };
  isActive: boolean;
  onComplete: () => void;
}

export function StoryViewerContent({
  story,
  isActive,
  onComplete,
}: StoryViewerContentProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaItem = story.media[0];

  useEffect(() => {
    if (isActive && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
    if (!isActive && videoRef.current) {
      videoRef.current.pause();
    }
  }, [isActive]);

  if (!mediaItem) return null;

  if (mediaItem.type === 'video') {
    return (
      <video
        ref={videoRef}
        src={mediaItem.url}
        className="size-full object-contain"
        autoPlay={isActive}
        muted
        playsInline
        onEnded={onComplete}
      />
    );
  }

  return (
    <img
      src={mediaItem.url}
      alt=""
      className="size-full object-contain"
      draggable={false}
    />
  );
}
