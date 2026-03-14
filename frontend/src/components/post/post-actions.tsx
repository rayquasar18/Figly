'use client';

import { Heart, MessageCircle, Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';
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
  const likeMutation = useLikeMutation();
  const unlikeMutation = useUnlikeMutation();
  const bookmarkMutation = useBookmarkMutation();
  const unbookmarkMutation = useUnbookmarkMutation();

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
            onClick={handleLikeToggle}
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
            onClick={onCommentClick}
            className="transition-transform active:scale-90"
            aria-label="Binh luan"
          >
            <MessageCircle className="size-6 text-foreground hover:text-muted-foreground" />
          </button>
        </div>
        <button
          onClick={handleBookmarkToggle}
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
        <p className="mt-1 text-sm font-semibold">
          {likeCount.toLocaleString()} luot thich
        </p>
      )}
    </div>
  );
}
