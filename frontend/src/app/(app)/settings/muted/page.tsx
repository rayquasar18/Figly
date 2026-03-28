'use client';

import { useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Volume2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useMutedUsers, useUnmuteUser } from '@/hooks/queries/moderation-queries';

export default function MutedUsersPage() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useMutedUsers();
  const unmuteUser = useUnmuteUser();

  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage],
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleObserver]);

  const allMuted = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/settings" className="rounded-full p-1 hover:bg-muted">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-xl font-bold">Nguoi dung da tat tieng</h1>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : allMuted.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <Volume2 className="size-12" />
          <p>Ban chua tat tieng ai</p>
        </div>
      ) : (
        <div className="space-y-2">
          {allMuted.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-3 rounded-lg border px-4 py-3"
            >
              <Avatar className="size-10">
                <AvatarImage src={user.avatarUrl ?? undefined} />
                <AvatarFallback>
                  {user.displayName?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">
                  {user.username ? `@${user.username}` : user.displayName}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {user.displayName}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => unmuteUser.mutate({ userId: user.id })}
                disabled={unmuteUser.isPending}
              >
                Bat tieng
              </Button>
            </div>
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="h-4" />
      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
    </div>
  );
}
