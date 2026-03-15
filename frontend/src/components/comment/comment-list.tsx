'use client';

import { useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useComments } from '@/hooks/queries/comment-queries';
import { CommentItem } from './comment-item';
import { CommentInput } from './comment-input';

interface CommentListProps {
  postId: string;
}

export function CommentList({ postId }: CommentListProps) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useComments(postId);
  const [replyTarget, setReplyTarget] = useState<{
    parentId: string;
    parentAuthorUsername: string;
  } | null>(null);

  const handleReply = useCallback(
    (parentId: string, parentAuthorUsername: string) => {
      setReplyTarget({ parentId, parentAuthorUsername });
    },
    [],
  );

  const handleCancelReply = useCallback(() => {
    setReplyTarget(null);
  }, []);

  const comments = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="flex flex-col">
      {/* Comment list */}
      <div className="flex-1 overflow-y-auto px-3">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : comments.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Chua co binh luan nao
          </p>
        ) : (
          <>
            {comments
              .filter((c) => !c.parentId)
              .map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  postId={postId}
                  onReply={handleReply}
                />
              ))}

            {hasNextPage && (
              <div className="py-2 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="text-xs text-muted-foreground"
                >
                  {isFetchingNextPage ? (
                    <Loader2 className="mr-1 size-3 animate-spin" />
                  ) : null}
                  Tai them binh luan
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Comment input */}
      <CommentInput
        postId={postId}
        replyTarget={replyTarget}
        onCancelReply={handleCancelReply}
      />
    </div>
  );
}
