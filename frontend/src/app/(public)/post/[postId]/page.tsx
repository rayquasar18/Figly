'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { usePostDetail } from '@/hooks/queries/post-queries';
import { PostCarousel } from '@/components/post/post-carousel';
import { PostActions } from '@/components/post/post-actions';
import { PostMenu } from '@/components/post/post-menu';
import { CaptionDisplay } from '@/components/post/caption-display';
import { CommentList } from '@/components/comment/comment-list';
import Link from 'next/link';

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.postId as string;
  const { data: post, isLoading } = usePostDetail(postId);

  if (isLoading) {
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

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">Khong tim thay bai viet</p>
        <button onClick={() => router.back()} className="mt-2 text-primary hover:underline">
          Quay lai
        </button>
      </div>
    );
  }

  const relativeTime = formatDistanceToNow(new Date(post.createdAt), {
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
        <PostMenu post={post} onDeleted={() => router.back()} />
      </div>

      {/* Author */}
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
        <Link href={`/${post.author.username}`} className="text-sm font-semibold hover:underline">
          {post.author.username}
        </Link>
      </div>

      {/* Image/Carousel */}
      <PostCarousel media={post.media} />

      {/* Actions */}
      <PostActions
        postId={post.id}
        isLiked={post.isLiked}
        isBookmarked={post.isBookmarked}
        likeCount={post.likeCount}
      />

      {/* Caption */}
      {post.caption && (
        <div className="mt-1 px-3">
          <CaptionDisplay caption={post.caption} username={post.author.username} />
        </div>
      )}

      {/* Timestamp */}
      <p className="mt-1 px-3 text-xs text-muted-foreground">{relativeTime}</p>

      {/* Comments */}
      <div className="mt-3 border-t">
        <CommentList postId={postId} />
      </div>
    </div>
  );
}
