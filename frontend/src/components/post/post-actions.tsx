'use client';

import { Heart, MessageCircle, Bookmark } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import {
  useLikeMutation,
  useUnlikeMutation,
  useBookmarkMutation,
  useUnbookmarkMutation,
} from '@/hooks/queries/interaction-queries';

interface PostActionsProps {
  postId: string;
  isLiked: boolean;
  isBookmarked: boolean;
  likeCount: number;
  onCommentClick?: () => void;
}

export function PostActions({
  postId,
  isLiked,
  isBookmarked,
  likeCount,
  onCommentClick,
}: PostActionsProps) {
  const isAuthenticated = !!useAuthStore((s) => s.user);
  const router = useRouter();
  const likeMutation = useLikeMutation();
  const unlikeMutation = useUnlikeMutation();
  const bookmarkMutation = useBookmarkMutation();
  const unbookmarkMutation = useUnbookmarkMutation();

  const requireAuth = (action: () => void) => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    action();
  };

  const handleLikeToggle = () => {
    if (isLiked) {
      unlikeMutation.mutate({ postId });
    } else {
      likeMutation.mutate({ postId });
    }
  };

  const handleBookmarkToggle = () => {
    if (isBookmarked) {
      unbookmarkMutation.mutate({ postId });
    } else {
      bookmarkMutation.mutate({ postId });
    }
  };

  return (
    <div className="px-3 pt-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => requireAuth(handleLikeToggle)}
            className="transition-transform active:scale-90"
            aria-label={isLiked ? 'Bo thich' : 'Thich'}
          >
            <Heart
              className={cn(
                'size-6',
                isLiked
                  ? 'fill-red-500 text-red-500'
                  : 'text-foreground hover:text-muted-foreground',
              )}
            />
          </button>
          <button
            onClick={() => requireAuth(() => onCommentClick?.())}
            className="transition-transform active:scale-90"
            aria-label="Binh luan"
          >
            <MessageCircle className="size-6 text-foreground hover:text-muted-foreground" />
          </button>
        </div>
        <button
          onClick={() => requireAuth(handleBookmarkToggle)}
          className="transition-transform active:scale-90"
          aria-label={isBookmarked ? 'Bo luu' : 'Luu'}
        >
          <Bookmark
            className={cn(
              'size-6',
              isBookmarked
                ? 'fill-foreground text-foreground'
                : 'text-foreground hover:text-muted-foreground',
            )}
          />
        </button>
      </div>

      {likeCount > 0 && (
        <p className="mt-1 text-sm font-semibold">{likeCount.toLocaleString()} luot thich</p>
      )}
    </div>
  );
}
