'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  usePostDetail,
  PostCarousel,
  PostActions,
  PostMenu,
  CaptionDisplay,
} from '@/features/post';
import { CommentList } from '@/features/comment';
import Link from 'next/link';
import type { PostResponse } from '@figly/shared';

interface PostDetailPageClientProps {
  postId: string;
  initialPost: PostResponse | null;
}

export default function PostDetailPageClient({
  postId,
  initialPost,
}: PostDetailPageClientProps) {
  const router = useRouter();
  const { data: post, isLoading } = usePostDetail(postId);

  // Use server-fetched data as fallback while client query loads
  const displayPost = post ?? initialPost;

  if (isLoading && !initialPost) {
    return (
      <div className="mx-auto max-w-[470px]">
        {/* Header skeleton */}
        <div className="flex items-center gap-3 border-b p-3">
          <button onClick={() => router.back()}>
            <ArrowLeft className="size-5" />
          </button>
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="aspect-square w-full" />
        <div className="space-y-2 p-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    );
  }

  if (!displayPost) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">Khong tim thay bai viet</p>
        <button
          onClick={() => router.back()}
          className="mt-2 text-primary hover:underline"
        >
          Quay lai
        </button>
      </div>
    );
  }

  const relativeTime = formatDistanceToNow(new Date(displayPost.createdAt), {
    addSuffix: true,
    locale: vi,
  });

  return (
    <div className="mx-auto max-w-[470px] pb-16">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background p-3">
        <button onClick={() => router.back()} aria-label="Quay lai">
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="flex-1 text-center font-semibold">Bai viet</h1>
        <PostMenu post={displayPost} onDeleted={() => router.back()} />
      </div>

      {/* Author */}
      <div className="flex items-center gap-3 px-3 py-2">
        <Link href={`/${displayPost.author.username ?? ''}`}>
          <Avatar className="size-8">
            {displayPost.author.avatarUrl ? (
              <AvatarImage
                src={displayPost.author.avatarUrl}
                alt={displayPost.author.username ?? ''}
              />
            ) : null}
            <AvatarFallback className="text-xs">
              {displayPost.author.displayName?.charAt(0)?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
        </Link>
        <Link
          href={`/${displayPost.author.username ?? ''}`}
          className="text-sm font-semibold hover:underline"
        >
          {displayPost.author.username ?? ''}
        </Link>
      </div>

      {/* Image/Carousel */}
      <PostCarousel media={displayPost.media} />

      {/* Actions */}
      <PostActions
        postId={displayPost.id}
        isLiked={displayPost.isLiked}
        isBookmarked={displayPost.isBookmarked}
        likeCount={displayPost.likeCount}
      />

      {/* Caption */}
      {displayPost.caption && (
        <div className="px-3 mt-1">
          <CaptionDisplay
            caption={displayPost.caption}
            username={displayPost.author.username ?? ''}
          />
        </div>
      )}

      {/* Timestamp */}
      <p className="px-3 mt-1 text-xs text-muted-foreground">{relativeTime}</p>

      {/* Comments */}
      <div className="mt-3 border-t">
        <CommentList postId={postId} />
      </div>
    </div>
  );
}
