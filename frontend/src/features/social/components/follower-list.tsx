'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/features/auth';
import {
  useFollowers,
  useFollowing,
  useRemoveFollowerMutation,
} from '../hooks/social-queries';
import { UserRow } from './user-row';

interface FollowerListProps {
  username: string;
  type: 'followers' | 'following';
}

function SearchIcon() {
  return (
    <svg
      className="size-4 text-muted-foreground"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
      />
    </svg>
  );
}

function SkeletonRows() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-2">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
      ))}
    </div>
  );
}

export function FollowerList({ username, type }: FollowerListProps) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { user: currentUser } = useAuthStore();
  const removeFollowerMutation = useRemoveFollowerMutation();

  // Debounce search input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Use the correct query hook based on type
  const query =
    type === 'followers'
      ? useFollowers(username, debouncedSearch || undefined)
      : useFollowing(username, debouncedSearch || undefined);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    query;

  // Determine if this is the current user's own followers list
  const isOwnFollowers =
    type === 'followers' && currentUser?.username === username;

  const handleRemove = useCallback(
    (userId: string) => {
      removeFollowerMutation.mutate({ userId });
    },
    [removeFollowerMutation],
  );

  // Infinite scroll via IntersectionObserver
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

  // Flatten pages into a single items array
  const items = data?.pages.flatMap((page) => page.items) ?? [];

  const emptyMessage =
    type === 'followers'
      ? 'Chua co nguoi theo doi nao'
      : 'Chua theo doi ai';

  return (
    <div className="flex flex-col gap-4">
      {/* Search bar */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
          <SearchIcon />
        </div>
        <Input
          type="text"
          placeholder="Tim kiem..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* List */}
      <ScrollArea className="h-[calc(100dvh-220px)]">
        {isLoading ? (
          <SkeletonRows />
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          </div>
        ) : (
          <div className="divide-y">
            {items.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                showRemoveButton={isOwnFollowers}
                onRemove={isOwnFollowers ? handleRemove : undefined}
              />
            ))}

            {/* Sentinel for infinite scroll */}
            <div ref={sentinelRef} className="h-px" />

            {isFetchingNextPage && (
              <div className="py-4">
                <SkeletonRows />
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
