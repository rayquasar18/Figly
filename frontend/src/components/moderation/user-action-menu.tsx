'use client';

import { useState } from 'react';
import { MoreHorizontal, Flag, Ban, VolumeX, AlertTriangle, ShieldBan } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useUnblockUser, useMuteUser, useUnmuteUser } from '@/hooks/queries/moderation-queries';
import { useWarnUser, useBanUser } from '@/hooks/queries/admin-queries';
import { ReportDialog } from './report-dialog';
import { BlockConfirmDialog } from './block-confirm-dialog';
import { useAuthStore } from '@/stores/auth-store';

interface UserActionMenuProps {
  userId: string;
  username: string;
  isBlocked: boolean;
  isMuted: boolean;
}

export function UserActionMenu({
  userId,
  username,
  isBlocked,
  isMuted,
}: UserActionMenuProps) {
  const { user: currentUser } = useAuthStore();
  const [reportOpen, setReportOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [banConfirmOpen, setBanConfirmOpen] = useState(false);

  const unblockUser = useUnblockUser();
  const muteUser = useMuteUser();
  const unmuteUser = useUnmuteUser();
  const warnUser = useWarnUser();
  const banUser = useBanUser();

  const isAdmin = currentUser?.role === 'ADMIN';

  const handleBlockAction = () => {
    if (isBlocked) {
      unblockUser.mutate({ userId });
    } else {
      setBlockOpen(true);
    }
  };

  const handleMuteAction = () => {
    if (isMuted) {
      unmuteUser.mutate({ userId });
    } else {
      muteUser.mutate({ userId });
    }
  };

  const handleWarn = () => {
    warnUser.mutate({ userId });
  };

  const handleBan = () => {
    banUser.mutate(
      { userId },
      {
        onSuccess: () => {
          setBanConfirmOpen(false);
        },
      },
    );
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="rounded-full p-1 hover:bg-muted" aria-label="Tuy chon nguoi dung">
            <MoreHorizontal className="size-5 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setReportOpen(true)}>
            <Flag className="mr-2 size-4" />
            Bao cao
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleBlockAction}>
            <Ban className="mr-2 size-4" />
            {isBlocked ? 'Bo chan' : 'Chan'}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleMuteAction}>
            <VolumeX className="mr-2 size-4" />
            {isMuted ? 'Bat tieng' : 'Tat tieng'}
          </DropdownMenuItem>

          {isAdmin && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleWarn}>
                <AlertTriangle className="mr-2 size-4" />
                Canh bao nguoi dung
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setBanConfirmOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                <ShieldBan className="mr-2 size-4" />
                Cam nguoi dung
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        targetId={userId}
        targetType="USER"
      />

      <BlockConfirmDialog
        open={blockOpen}
        onOpenChange={setBlockOpen}
        userId={userId}
        username={username}
      />

      <AlertDialog open={banConfirmOpen} onOpenChange={setBanConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cam {username}?</AlertDialogTitle>
            <AlertDialogDescription>
              Ban co chac chan muon cam nguoi dung nay? Ho se khong the dang nhap.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBan}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {banUser.isPending ? 'Dang cam...' : 'Cam'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
