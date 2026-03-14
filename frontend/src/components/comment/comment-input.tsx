'use client';

import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useCreateComment } from '@/hooks/queries/comment-queries';
import { POST_LIMITS } from '@figly/shared';

interface CommentInputProps {
  postId: string;
  replyTarget?: {
    parentId: string;
    parentAuthorUsername: string;
  } | null;
  onCancelReply?: () => void;
}

export function CommentInput({
  postId,
  replyTarget,
  onCancelReply,
}: CommentInputProps) {
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const createComment = useCreateComment(postId);

  // Focus and pre-fill when replying
  useEffect(() => {
    if (replyTarget) {
      setContent(`@${replyTarget.parentAuthorUsername} `);
      textareaRef.current?.focus();
    }
  }, [replyTarget]);

  const handleSubmit = () => {
    const trimmed = content.trim();
    if (!trimmed) return;

    createComment.mutate(
      {
        content: trimmed,
        parentId: replyTarget?.parentId,
      },
      {
        onSuccess: () => {
          setContent('');
          onCancelReply?.();
        },
      },
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t p-3">
      {replyTarget && (
        <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
          <span>Tra loi @{replyTarget.parentAuthorUsername}</span>
          <button
            onClick={onCancelReply}
            className="text-primary hover:underline"
          >
            Huy
          </button>
        </div>
      )}
      <div className="flex items-end gap-2">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Them binh luan..."
          maxLength={POST_LIMITS.commentMaxLength}
          className="min-h-[36px] max-h-[100px] resize-none border-0 p-0 text-sm shadow-none focus-visible:ring-0"
          rows={1}
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSubmit}
          disabled={!content.trim() || createComment.isPending}
          className="shrink-0 text-primary"
        >
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}
