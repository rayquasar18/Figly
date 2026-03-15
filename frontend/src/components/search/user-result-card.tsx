'use client';

import Link from 'next/link';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import type { SearchUserResult } from '@figly/shared';

interface UserResultCardProps {
  user: SearchUserResult;
}

export function UserResultCard({ user }: UserResultCardProps) {
  return (
    <Link
      href={`/${user.username}`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors"
    >
      <Avatar className="size-8">
        {user.avatarUrl ? (
          <AvatarImage src={user.avatarUrl} alt={user.username} />
        ) : null}
        <AvatarFallback className="text-xs">
          {user.displayName?.charAt(0)?.toUpperCase() || '?'}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold truncate">{user.displayName}</p>
        <p className="text-xs text-muted-foreground truncate">
          @{user.username}
        </p>
      </div>
    </Link>
  );
}
