'use client';

import { Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from 'next/navigation';
import {
  useLikeMutation,
  useUnlikeMutation,
  useBookmarkMutation,
  useUnbookmarkMutation,
} from '@/hooks/queries/interaction-queries';
import type { PostResponse } from '@figly/shared';

interface ReelActionsProps {
  reel: PostResponse;
  onCommentClick: () => void;
}

export function ReelActions({ reel, onCommentClick }: ReelActionsProps) {
  const router = useRouter();
  const isAuthenticated = !!useAuthStore((s) => s.user);
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
    if (reel.isLiked) {
      unlikeMutation.mutate({ postId: reel.id });
    } else {
      likeMutation.mutate({ postId: reel.id });
    }
  };

  const handleBookmarkToggle = () => {
    if (reel.isBookmarked) {
      unbookmarkMutation.mutate({ postId: reel.id });
    } else {
      bookmarkMutation.mutate({ postId: reel.id });
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/post/${reel.id}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Da sao chep lien ket');
    });
  };

  return (
    <div className="absolute bottom-[20%] right-3 flex flex-col items-center gap-4">
      {/* Like */}
      <button
        onClick={() => requireAuth(handleLikeToggle)}
        className="flex size-10 flex-col items-center justify-center transition-transform active:scale-90"
        aria-label={reel.isLiked ? 'Bo thich' : 'Thich'}
      >
        <Heart
          className={cn(
            'size-7',
            reel.isLiked
              ? 'fill-red-500 text-red-500'
              : 'text-white',
          )}
        />
      </button>
      {reel.likeCount > 0 && (
        <span className="-mt-3 text-xs font-medium text-white">
          {reel.likeCount.toLocaleString()}
        </span>
      )}

      {/* Comment */}
      <button
        onClick={() => requireAuth(onCommentClick)}
        className="flex size-10 flex-col items-center justify-center"
        aria-label="Binh luan"
      >
        <MessageCircle className="size-7 text-white" />
      </button>
      {reel.commentCount > 0 && (
        <span className="-mt-3 text-xs font-medium text-white">
          {reel.commentCount.toLocaleString()}
        </span>
      )}

      {/* Share */}
      <button
        onClick={handleShare}
        className="flex size-10 items-center justify-center"
        aria-label="Chia se"
      >
        <Share2 className="size-7 text-white" />
      </button>

      {/* Bookmark */}
      <button
        onClick={() => requireAuth(handleBookmarkToggle)}
        className="flex size-10 items-center justify-center transition-transform active:scale-90"
        aria-label={reel.isBookmarked ? 'Bo luu' : 'Luu'}
      >
        <Bookmark
          className={cn(
            'size-7',
            reel.isBookmarked
              ? 'fill-white text-white'
              : 'text-white',
          )}
        />
      </button>
    </div>
  );
}
