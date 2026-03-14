'use client';

import { useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Heart } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { PostCarousel } from './post-carousel';
import { PostActions } from './post-actions';
import { CaptionDisplay } from './caption-display';
import { useAuthStore } from '@/stores/auth-store';
import { useLikeMutation } from '@/hooks/queries/interaction-queries';
import type { PostResponse } from '@figly/shared';

interface PostCardProps {
  post: PostResponse;
  onOpenDetail?: (postId: string) => void;
}

export function PostCard({ post, onOpenDetail }: PostCardProps) {
  const router = useRouter();
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const lastTapRef = useRef(0);
  const likeMutation = useLikeMutation();

  const handleDoubleTap = useCallback(() => {
    // Auth gate: redirect unauthenticated users to login instead of liking
    if (!useAuthStore.getState().user) {
      router.push('/login');
      return;
    }
    if (!post.isLiked) {
      likeMutation.mutate({ postId: post.id });
    }
    // Show heart animation regardless
    setShowHeartAnimation(true);
    setTimeout(() => setShowHeartAnimation(false), 1000);
  }, [post.isLiked, post.id, likeMutation]);

  const handleCommentClick = useCallback(() => {
    if (onOpenDetail) {
      onOpenDetail(post.id);
    } else {
      router.push(`/post/${post.id}`);
    }
  }, [onOpenDetail, post.id, router]);

  const handleViewComments = useCallback(() => {
    if (onOpenDetail) {
      onOpenDetail(post.id);
    } else {
      router.push(`/post/${post.id}`);
    }
  }, [onOpenDetail, post.id, router]);

  const relativeTime = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
    locale: vi,
  });

  return (
    <article className="border-b pb-4">
      {/* Author header */}
      <div className="flex items-center gap-3 px-3 py-2">
        <Link href={`/${post.author.username}`}>
          <Avatar className="size-8">
            {post.author.avatarUrl ? (
              <AvatarImage src={post.author.avatarUrl} alt={post.author.username} />
            ) : null}
            <AvatarFallback className="text-xs">
              {post.author.displayName?.charAt(0)?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <Link
            href={`/${post.author.username}`}
            className="text-sm font-semibold hover:underline"
          >
            {post.author.username}
          </Link>
        </div>
        <span className="text-xs text-muted-foreground">{relativeTime}</span>
      </div>

      {/* Post image/carousel with double-tap like and heart animation */}
      <div className="relative">
        <PostCarousel media={post.media} onDoubleTap={handleDoubleTap} />

        {/* Heart animation overlay */}
        {showHeartAnimation && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <Heart
              className={cn(
                'size-20 fill-white text-white drop-shadow-lg',
                'animate-in zoom-in-50 fade-in duration-300',
              )}
              style={{
                animation: 'heartBurst 1s ease-out forwards',
              }}
            />
          </div>
        )}
      </div>

      {/* Action buttons */}
      <PostActions
        postId={post.id}
        isLiked={post.isLiked}
        isBookmarked={post.isBookmarked}
        likeCount={post.likeCount}
        onCommentClick={handleCommentClick}
      />

      {/* Caption */}
      <div className="px-3 mt-1">
        <CaptionDisplay
          caption={post.caption}
          username={post.author.username}
          truncate
        />
      </div>

      {/* View all comments link */}
      {post.commentCount > 0 && (
        <button
          onClick={handleViewComments}
          className="px-3 mt-1 text-sm text-muted-foreground hover:text-foreground"
        >
          Xem tat ca {post.commentCount} binh luan
        </button>
      )}

      {/* CSS for heart animation */}
      <style jsx global>{`
        @keyframes heartBurst {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          15% {
            transform: scale(1.2);
            opacity: 1;
          }
          30% {
            transform: scale(0.95);
            opacity: 1;
          }
          45%,
          80% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }
      `}</style>
    </article>
  );
}
