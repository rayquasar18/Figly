'use client';

import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet';
import { CommentList } from '@/components/comment/comment-list';

interface ReelCommentsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
}

export function ReelCommentsSheet({
  open,
  onOpenChange,
  postId,
}: ReelCommentsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="flex h-[50vh] flex-col rounded-t-xl p-0"
      >
        {/* Drag handle */}
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-muted-foreground/30" />

        {/* Header */}
        <div className="border-b px-4 py-3">
          <SheetTitle className="text-center text-lg font-semibold">
            Binh luan
          </SheetTitle>
        </div>

        {/* Comment list with input */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <CommentList postId={postId} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
