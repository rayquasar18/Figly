'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Trash2 } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores/auth-store';
import { useDeleteComment } from '@/hooks/queries/comment-queries';
import type { CommentResponse } from '@figly/shared';

interface CommentItemProps {
  comment: CommentResponse;
  postId: string;
  onReply?: (parentId: string, parentAuthorUsername: string) => void;
  isReply?: boolean;
}

/** Parse @mentions in comment text and render as links */
function renderCommentContent(text: string) {
  const regex = /(@[\p{L}\p{N}_]+)/gu;
  const parts = text.split(regex);

  return parts.map((part, i) => {
    if (part.match(regex)) {
      const username = part.slice(1);
      return (
        <Link key={i} href={`/${username}`} className="text-primary hover:underline">
          {part}
        </Link>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

export function CommentItem({ comment, postId, onReply, isReply = false }: CommentItemProps) {
  const { user: currentUser } = useAuthStore();
  const deleteComment = useDeleteComment(postId);
  const isOwner = currentUser?.id === comment.author.id;

  const relativeTime = formatDistanceToNow(new Date(comment.createdAt), {
    addSuffix: false,
    locale: vi,
  });

  return (
    <div className={isReply ? 'pl-10' : ''}>
      <div className="flex gap-3 py-2">
        <Link href={`/${comment.author.username}`} className="shrink-0">
          <Avatar className={isReply ? 'size-6' : 'size-8'}>
            {comment.author.avatarUrl ? (
              <AvatarImage src={comment.author.avatarUrl} alt={comment.author.username} />
            ) : null}
            <AvatarFallback className="text-xs">
              {comment.author.displayName?.charAt(0)?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="min-w-0 flex-1">
          <div className="text-sm">
            <Link
              href={`/${comment.author.username}`}
              className="mr-1 font-semibold hover:underline"
            >
              {comment.author.username}
            </Link>
            {renderCommentContent(comment.content)}
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
            <span>{relativeTime}</span>
            {onReply && (
              <button
                onClick={() => onReply(comment.parentId ?? comment.id, comment.author.username)}
                className="font-semibold hover:text-foreground"
              >
                Tra loi
              </button>
            )}
            {isOwner && (
              <button
                onClick={() => deleteComment.mutate({ commentId: comment.id })}
                className="hover:text-destructive"
                aria-label="Xoa binh luan"
              >
                <Trash2 className="size-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Nested replies */}
      {comment.replies?.length > 0 && (
        <div>
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} postId={postId} onReply={onReply} isReply />
          ))}
        </div>
      )}
    </div>
  );
}
