'use client';

import Link from 'next/link';
import { Loader2, Package } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePostDetail } from '@/hooks/queries/post-queries';
import { PostCarousel } from './post-carousel';
import { PostActions } from './post-actions';
import { PostMenu } from './post-menu';
import { CaptionDisplay } from './caption-display';
import { CommentList } from '@/components/comment/comment-list';

interface PostDetailModalProps {
  postId: string | null;
  open: boolean;
  onClose: () => void;
}

export function PostDetailModal({ postId, open, onClose }: PostDetailModalProps) {
  if (!postId) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden gap-0">
        <DialogTitle className="sr-only">Chi tiet bai viet</DialogTitle>
        <PostDetailContent postId={postId} onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
}

function PostDetailContent({
  postId,
  onClose,
}: {
  postId: string;
  onClose: () => void;
}) {
  const { data: post, isLoading } = usePostDetail(postId);

  if (isLoading || !post) {
    return (
      <div className="flex h-[500px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const relativeTime = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
    locale: vi,
  });

  return (
    <div className="flex h-[85vh] max-h-[600px] flex-col md:flex-row">
      {/* Left: Image/Carousel */}
      <div className="flex w-full items-center justify-center bg-black md:w-1/2">
        <PostCarousel media={post.media} />
      </div>

      {/* Right: Info & Comments */}
      <div className="flex w-full flex-col md:w-1/2">
        {/* Author header */}
        <div className="flex items-center gap-3 border-b px-4 py-3">
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
          <Link
            href={`/${post.author.username}`}
            className="flex-1 text-sm font-semibold hover:underline"
          >
            {post.author.username}
          </Link>
          <PostMenu post={post} onDeleted={onClose} />
        </div>

        {/* Comments area */}
        <ScrollArea className="flex-1">
          {/* Caption as first "comment" */}
          {post.caption && (
            <div className="px-4 py-3 border-b">
              <CaptionDisplay
                caption={post.caption}
                username={post.author.username}
              />
            </div>
          )}

          {/* Linked items */}
          {post.linkedItems && post.linkedItems.length > 0 && (
            <div className="flex flex-wrap gap-1.5 border-b px-4 py-2.5">
              {post.linkedItems.map((item) => (
                <Link key={item.id} href={`/item/${item.id}`}>
                  <Badge
                    variant="secondary"
                    className="cursor-pointer gap-1 text-xs hover:bg-secondary/80"
                  >
                    <Package className="size-3" />
                    {item.name}
                  </Badge>
                </Link>
              ))}
            </div>
          )}

          <CommentList postId={postId} />
        </ScrollArea>

        {/* Actions */}
        <div className="border-t">
          <PostActions
            postId={post.id}
            isLiked={post.isLiked}
            isBookmarked={post.isBookmarked}
            likeCount={post.likeCount}
          />
          <p className="px-3 pb-2 text-xs text-muted-foreground">
            {relativeTime}
          </p>
        </div>
      </div>
    </div>
  );
}
