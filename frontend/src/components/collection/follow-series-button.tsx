'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { useFollowSeries, useFollowCategory } from '@/hooks/queries/collection-queries';

interface FollowSeriesButtonProps {
  type: 'series' | 'category';
  id: string;
  isFollowed: boolean;
  size?: 'sm' | 'default';
}

export function FollowSeriesButton({ type, id, isFollowed, size = 'sm' }: FollowSeriesButtonProps) {
  const router = useRouter();
  const followSeries = useFollowSeries();
  const followCategory = useFollowCategory();

  const mutation = type === 'series' ? followSeries : followCategory;
  const isPending = mutation.isPending;

  function handleClick() {
    if (isPending) return;

    // Auth gate: redirect unauthenticated users to login
    if (!useAuthStore.getState().user) {
      router.push('/login');
      return;
    }

    mutation.mutate({ id });
  }

  return (
    <Button
      variant={isFollowed ? 'outline' : 'default'}
      size={size}
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        isFollowed && 'hover:border-destructive hover:bg-destructive/10 hover:text-destructive',
      )}
    >
      {isFollowed ? 'Dang theo doi' : 'Theo doi'}
    </Button>
  );
}
