'use client';

import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StoryAvatarProps {
  user?: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  hasUnviewed?: boolean;
  onClick: () => void;
  isAddButton?: boolean;
}

export function StoryAvatar({
  user,
  hasUnviewed,
  onClick,
  isAddButton,
}: StoryAvatarProps) {
  if (isAddButton) {
    return (
      <button
        onClick={onClick}
        className="flex flex-col items-center gap-1"
        aria-label="Them story"
      >
        <div className="relative flex size-16 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/40">
          <Plus className="size-5 text-muted-foreground" />
        </div>
        <span className="text-[10px] text-muted-foreground">Cua ban</span>
      </button>
    );
  }

  if (!user) return null;

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1"
      aria-label={`${user.username} story`}
    >
      <div
        className={cn(
          'rounded-full p-[2px]',
          hasUnviewed
            ? 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500'
            : 'bg-muted-foreground/30',
        )}
      >
        <div className="rounded-full border-2 border-background p-[1px]">
          <div className="size-14 overflow-hidden rounded-full bg-muted">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              <span className="flex size-full items-center justify-center text-sm font-medium">
                {user.displayName?.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </div>
      <span className="max-w-[64px] truncate text-[10px]">
        {user.username}
      </span>
    </button>
  );
}
