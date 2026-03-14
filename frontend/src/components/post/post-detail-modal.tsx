'use client';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

interface PostDetailModalProps {
  postId: string | null;
  open: boolean;
  onClose: () => void;
}

/** Placeholder post detail modal - full implementation in Plan 03-04 */
export function PostDetailModal({ postId, open, onClose }: PostDetailModalProps) {
  if (!postId) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        <DialogTitle className="sr-only">Chi tiet bai viet</DialogTitle>
        <div className="flex items-center justify-center p-8 text-muted-foreground">
          Dang tai...
        </div>
      </DialogContent>
    </Dialog>
  );
}
