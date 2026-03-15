'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { PublicUser } from '@figly/shared';

interface PublicNavProps {
  user: PublicUser | null;
  isLoading: boolean;
}

export function PublicNav({ user, isLoading }: PublicNavProps) {
  return (
    <nav className="sticky top-0 z-40 border-b bg-background">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
        {/* Logo / Brand */}
        <Link href={user ? '/' : '/explore'} className="text-xl font-bold">
          Figly
        </Link>

        {/* Right side: auth actions or user avatar */}
        {isLoading ? (
          <div className="h-8 w-20 animate-pulse rounded bg-muted" />
        ) : user ? (
          <Link href={`/${user.username}`}>
            <Avatar className="size-8">
              <AvatarFallback className="text-xs">
                {user.name?.charAt(0)?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
          </Link>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Dang nhap</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/signup">Dang ky</Link>
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}
