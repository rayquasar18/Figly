'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import {
  useFollowMutation,
  useUnfollowMutation,
} from '@/hooks/queries/social-queries';

interface FollowButtonProps {
  userId: string;
  username: string;
  isFollowing: boolean;
  size?: 'sm' | 'default';
}

export function FollowButton({
  userId,
  username,
  isFollowing,
  size = 'sm',
}: FollowButtonProps) {
  const router = useRouter();
  const followMutation = useFollowMutation();
  const unfollowMutation = useUnfollowMutation();
  const isPending = followMutation.isPending || unfollowMutation.isPending;

  function handleClick() {
    if (isPending) return;

    // Auth gate: redirect unauthenticated users to login
    if (!useAuthStore.getState().user) {
      router.push('/login');
      return;
    }

    if (isFollowing) {
      unfollowMutation.mutate({ userId, username });
    } else {
      followMutation.mutate({ userId, username });
    }
  }

  return (
    <Button
      variant={isFollowing ? 'outline' : 'default'}
      size={size}
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        isFollowing &&
          'hover:border-destructive hover:text-destructive hover:bg-destructive/10',
      )}
    >
      {isFollowing ? 'Dang theo doi' : 'Theo doi'}
    </Button>
  );
}
