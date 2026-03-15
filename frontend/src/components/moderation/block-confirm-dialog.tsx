'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useBlockUser } from '@/hooks/queries/moderation-queries';

interface BlockConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  username: string;
}

export function BlockConfirmDialog({
  open,
  onOpenChange,
  userId,
  username,
}: BlockConfirmDialogProps) {
  const blockUser = useBlockUser();

  const handleBlock = () => {
    blockUser.mutate(
      { userId },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Chan {username}?</AlertDialogTitle>
          <AlertDialogDescription>
            Ban co chac chan muon chan {username}? Ho se khong the xem trang ca nhan,
            bai viet hoac nhan tin cho ban. Ban cung se khong thay noi dung cua ho.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Huy</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleBlock}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {blockUser.isPending ? 'Dang chan...' : 'Chan'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
