'use client';

import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useCreateComment } from '@/hooks/queries/comment-queries';
import { useAuthStore } from '@/stores/auth-store';
import { POST_LIMITS } from '@figly/shared';

interface CommentInputProps {
  postId: string;
  replyTarget?: {
    parentId: string;
    parentAuthorUsername: string;
  } | null;
  onCancelReply?: () => void;
}

export function CommentInput({ postId, replyTarget, onCancelReply }: CommentInputProps) {
  const isAuthenticated = !!useAuthStore((s) => s.user);
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

  // Unauthenticated: show login CTA instead of comment form
  if (!isAuthenticated) {
    return (
      <div className="border-t p-3">
        <Link
          href="/login"
          className="flex items-center justify-center rounded-md border p-2.5 text-sm text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
        >
          Dang nhap de binh luan
        </Link>
      </div>
    );
  }

  return (
    <div className="border-t p-3">
      {replyTarget && (
        <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
          <span>Tra loi @{replyTarget.parentAuthorUsername}</span>
          <button onClick={onCancelReply} className="text-primary hover:underline">
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
          className="max-h-[100px] min-h-[36px] resize-none border-0 p-0 text-sm shadow-none focus-visible:ring-0"
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
