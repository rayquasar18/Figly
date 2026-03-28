'use client';

import { X, Trash2, AlertTriangle, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  useDismissReport,
  useRemoveContent,
  useWarnUser,
  useBanUser,
} from '@/hooks/queries/admin-queries';

interface AdminActionsProps {
  reportId: string;
  targetUserId: string;
  targetType: 'POST' | 'USER';
}

export function AdminActions({ reportId, targetUserId, targetType }: AdminActionsProps) {
  const dismissReport = useDismissReport();
  const removeContent = useRemoveContent();
  const warnUser = useWarnUser();
  const banUser = useBanUser();

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => dismissReport.mutate({ reportId })}
        disabled={dismissReport.isPending}
      >
        <X className="mr-1 size-3" />
        Bo qua
      </Button>

      {targetType === 'POST' && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => removeContent.mutate({ reportId })}
          disabled={removeContent.isPending}
        >
          <Trash2 className="mr-1 size-3" />
          Xoa noi dung
        </Button>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={() => warnUser.mutate({ userId: targetUserId })}
        disabled={warnUser.isPending}
      >
        <AlertTriangle className="mr-1 size-3" />
        Canh bao
      </Button>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="sm">
            <Ban className="mr-1 size-3" />
            Cam
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cam nguoi dung?</AlertDialogTitle>
            <AlertDialogDescription>
              Ban co chac chan muon cam nguoi dung nay? Ho se khong the dang nhap.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => banUser.mutate({ userId: targetUserId })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {banUser.isPending ? 'Dang cam...' : 'Cam'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
