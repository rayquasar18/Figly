'use client';

import { useState } from 'react';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateCaption, useDeletePost } from '../hooks/interaction-queries';
import { useAuthStore } from '@/features/auth';
import { POST_LIMITS } from '@figly/shared';
import type { PostResponse } from '@figly/shared';

interface PostMenuProps {
  post: PostResponse;
  onDeleted?: () => void;
}

export function PostMenu({ post, onDeleted }: PostMenuProps) {
  const { user: currentUser } = useAuthStore();
  const updateCaption = useUpdateCaption();
  const deletePost = useDeletePost();
  const [editMode, setEditMode] = useState(false);
  const [editCaption, setEditCaption] = useState(post.caption || '');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Only show on own posts
  if (!currentUser || currentUser.id !== post.author.id) {
    return null;
  }

  const handleSaveCaption = () => {
    updateCaption.mutate(
      { postId: post.id, caption: editCaption },
      {
        onSuccess: () => {
          setEditMode(false);
        },
      },
    );
  };

  const handleDelete = () => {
    deletePost.mutate(
      { postId: post.id },
      {
        onSuccess: () => {
          setShowDeleteDialog(false);
          onDeleted?.();
        },
      },
    );
  };

  if (editMode) {
    return (
      <div className="space-y-2 px-3 py-2">
        <Textarea
          value={editCaption}
          onChange={(e) => setEditCaption(e.target.value)}
          maxLength={POST_LIMITS.captionMaxLength}
          className="min-h-[60px] text-sm"
          rows={2}
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSaveCaption} disabled={updateCaption.isPending}>
            {updateCaption.isPending ? 'Dang luu...' : 'Luu'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setEditMode(false);
              setEditCaption(post.caption || '');
            }}
          >
            Huy
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="rounded-full p-1 hover:bg-muted" aria-label="Menu bai viet">
            <MoreHorizontal className="size-5 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => {
              setEditCaption(post.caption || '');
              setEditMode(true);
            }}
          >
            <Pencil className="mr-2 size-4" />
            Chinh sua chu thich
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 size-4" />
            Xoa bai viet
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoa bai viet</AlertDialogTitle>
            <AlertDialogDescription>
              Ban co chac chan muon xoa bai viet nay khong? Hanh dong nay khong the hoan tac.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletePost.isPending ? 'Dang xoa...' : 'Xoa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
