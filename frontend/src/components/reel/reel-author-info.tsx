'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores/auth-store';
import { useFollowMutation } from '@/hooks/queries/social-queries';
import type { PostResponse } from '@figly/shared';

interface ReelAuthorInfoProps {
  reel: PostResponse;
}

export function ReelAuthorInfo({ reel }: ReelAuthorInfoProps) {
  const currentUser = useAuthStore((s) => s.user);
  const isOwnProfile = currentUser?.username === reel.author.username;
  const followMutation = useFollowMutation();
  const [isFollowed, setIsFollowed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleFollow = () => {
    if (!currentUser) return;
    followMutation.mutate(
      { userId: reel.author.id, username: reel.author.username },
      { onSuccess: () => setIsFollowed(true) },
    );
  };

  return (
    <div className="absolute bottom-16 left-3 max-w-[70%]">
      {/* Author row */}
      <div className="flex items-center gap-2">
        <Link href={`/${reel.author.username}`}>
          <Avatar className="size-8">
            {reel.author.avatarUrl && (
              <AvatarImage src={reel.author.avatarUrl} alt={reel.author.username} />
            )}
            <AvatarFallback className="text-xs">
              {reel.author.displayName?.charAt(0)?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
        </Link>
        <Link
          href={`/${reel.author.username}`}
          className="text-sm font-semibold text-white"
        >
          {reel.author.username}
        </Link>
        {!isOwnProfile && !isFollowed && (
          <button
            onClick={handleFollow}
            disabled={followMutation.isPending}
            className="rounded-md border border-white px-3 py-1 text-xs font-semibold text-white"
            aria-label={`Theo doi ${reel.author.username}`}
          >
            Theo doi
          </button>
        )}
      </div>

      {/* Caption */}
      {reel.caption && (
        <div className="mt-1.5">
          <p
            className={`text-sm text-white ${!expanded ? 'line-clamp-2' : ''}`}
          >
            {reel.caption}
          </p>
          {!expanded && reel.caption.length > 100 && (
            <button
              onClick={() => setExpanded(true)}
              className="text-sm text-white/70"
            >
              ...xem them
            </button>
          )}
        </div>
      )}

      {/* Linked items */}
      {reel.linkedItems && reel.linkedItems.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {reel.linkedItems.map((item) => (
            <span
              key={item.id}
              className="rounded-full bg-white/20 px-2 py-0.5 text-xs text-white"
            >
              {item.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
