'use client';

import Link from 'next/link';
import type { UserListItem } from '@figly/shared';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { FollowButton } from './follow-button';

interface UserRowProps {
  user: UserListItem;
  showRemoveButton?: boolean;
  onRemove?: (userId: string) => void;
}

function getInitials(name: string | undefined | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function UserRow({ user, showRemoveButton, onRemove }: UserRowProps) {
  return (
    <div className="flex items-center gap-3 py-2">
      {/* Avatar */}
      <Link href={`/${user.username}`} className="shrink-0">
        <Avatar className="size-10">
          <AvatarImage src={user.avatarUrl ?? undefined} alt={user.displayName} />
          <AvatarFallback className="text-sm font-medium">
            {getInitials(user.displayName)}
          </AvatarFallback>
        </Avatar>
      </Link>

      {/* Name and username */}
      <div className="min-w-0 flex-1">
        <Link
          href={`/${user.username}`}
          className="block truncate text-sm font-semibold hover:underline"
        >
          {user.displayName}
        </Link>
        <Link href={`/${user.username}`} className="block truncate text-sm text-muted-foreground">
          @{user.username}
        </Link>
      </div>

      {/* Action button */}
      {showRemoveButton ? (
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => onRemove?.(user.id)}
        >
          Go
        </Button>
      ) : (
        <div className="shrink-0">
          <FollowButton
            userId={user.id}
            username={user.username}
            isFollowing={user.isFollowing}
            size="sm"
          />
        </div>
      )}
    </div>
  );
}
