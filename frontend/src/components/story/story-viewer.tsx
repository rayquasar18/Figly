'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { X, Eye, MoreHorizontal, Trash2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
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
import { useAuthStore } from '@/stores/auth-store';
import {
  storyKeys,
  useMarkStoryViewed,
  useDeleteStory,
} from '@/hooks/queries/story-queries';
import { StoryViewerContent } from './story-viewer-content';
import type { StoryGroupResponse } from '@figly/shared';

interface StoryViewerProps {
  groups: StoryGroupResponse[];
  initialGroupIndex: number;
  onClose: () => void;
}

export function StoryViewer({
  groups,
  initialGroupIndex,
  onClose,
}: StoryViewerProps) {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const markViewed = useMarkStoryViewed();
  const deleteStory = useDeleteStory();

  const [currentGroupIndex, setCurrentGroupIndex] = useState(initialGroupIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(() => {
    const group = groups[initialGroupIndex];
    if (!group) return 0;
    const firstUnviewed = group.stories.findIndex((s) => !s.isViewed);
    return firstUnviewed >= 0 ? firstUnviewed : 0;
  });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const currentGroup = groups[currentGroupIndex];
  const currentStory = currentGroup?.stories[currentStoryIndex];
  const isOwnStory = currentUser?.id === currentGroup?.user.id;

  // Determine if current story is a video
  const isVideo = currentStory?.media[0]?.type === 'video';

  // Mark story as viewed when it becomes active (non-own stories only)
  useEffect(() => {
    if (currentStory && !isOwnStory && !currentStory.isViewed) {
      markViewed.mutate(currentStory.id);
    }
  }, [currentStory?.id, isOwnStory]);

  const handleClose = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: storyKeys.feed() });
    onClose();
  }, [queryClient, onClose]);

  const goNext = useCallback(() => {
    if (!currentGroup) return;

    if (currentStoryIndex < currentGroup.stories.length - 1) {
      // Next story in same group
      setCurrentStoryIndex((prev) => prev + 1);
    } else if (currentGroupIndex < groups.length - 1) {
      // Next group
      const nextGroup = groups[currentGroupIndex + 1];
      const firstUnviewed = nextGroup.stories.findIndex((s) => !s.isViewed);
      setCurrentGroupIndex((prev) => prev + 1);
      setCurrentStoryIndex(firstUnviewed >= 0 ? firstUnviewed : 0);
    } else {
      // Last group, last story -- close
      handleClose();
    }
  }, [currentGroup, currentStoryIndex, currentGroupIndex, groups, handleClose]);

  const goPrev = useCallback(() => {
    if (currentStoryIndex > 0) {
      // Previous story in same group
      setCurrentStoryIndex((prev) => prev - 1);
    } else if (currentGroupIndex > 0) {
      // Previous group, last story
      const prevGroup = groups[currentGroupIndex - 1];
      setCurrentGroupIndex((prev) => prev - 1);
      setCurrentStoryIndex(prevGroup.stories.length - 1);
    }
    // If first group, first story -- do nothing
  }, [currentStoryIndex, currentGroupIndex, groups]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showDeleteDialog) return;
      if (e.key === 'Escape') handleClose();
      else if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose, goNext, goPrev, showDeleteDialog]);

  const handleDelete = useCallback(() => {
    if (!currentStory) return;
    deleteStory.mutate(currentStory.id, {
      onSuccess: () => {
        setShowDeleteDialog(false);
        // If deleted story was last in group, advance to next group or close
        if (
          currentGroup &&
          currentGroup.stories.length <= 1 &&
          currentGroupIndex >= groups.length - 1
        ) {
          handleClose();
        } else if (
          currentGroup &&
          currentGroup.stories.length <= 1
        ) {
          // Move to next group
          const nextGroup = groups[currentGroupIndex + 1];
          if (nextGroup) {
            setCurrentGroupIndex((prev) => prev + 1);
            setCurrentStoryIndex(0);
          } else {
            handleClose();
          }
        } else {
          // Stay in same group, go to next story (or previous if at end)
          if (
            currentGroup &&
            currentStoryIndex >= currentGroup.stories.length - 1
          ) {
            setCurrentStoryIndex((prev) => Math.max(0, prev - 1));
          }
        }
      },
    });
  }, [
    currentStory,
    currentGroup,
    currentGroupIndex,
    currentStoryIndex,
    groups,
    deleteStory,
    handleClose,
  ]);

  // Progress bar animation key reset
  const progressKey = `${currentGroupIndex}-${currentStoryIndex}`;

  const relativeTime = useMemo(() => {
    if (!currentStory) return '';
    return formatDistanceToNow(new Date(currentStory.createdAt), {
      addSuffix: true,
      locale: vi,
    });
  }, [currentStory?.createdAt]);

  if (!currentGroup || !currentStory) return null;

  return (
    <div
      className="fixed inset-0 z-[60] bg-black"
      role="dialog"
      aria-modal="true"
      aria-label={`Xem story cua ${currentGroup.user.username}`}
    >
      {/* Media content */}
      <div className="absolute inset-0">
        <StoryViewerContent
          story={currentStory}
          isActive={true}
          onComplete={goNext}
        />
      </div>

      {/* Top overlay gradient */}
      <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/50 to-transparent px-3 pt-2">
        {/* Progress bars */}
        <div className="mb-2 flex gap-[2px]">
          {currentGroup.stories.map((story, i) => (
            <div
              key={story.id}
              className="h-[2px] flex-1 overflow-hidden rounded-full bg-white/30"
              role="progressbar"
              aria-valuenow={
                i < currentStoryIndex ? 100 : i === currentStoryIndex ? 50 : 0
              }
              aria-valuemax={100}
            >
              {i < currentStoryIndex && (
                <div className="h-full w-full bg-white" />
              )}
              {i === currentStoryIndex && (
                <div
                  key={progressKey}
                  className={
                    isVideo
                      ? 'h-full bg-white transition-all duration-100'
                      : 'h-full animate-story-progress bg-white'
                  }
                  style={!isVideo ? { animationDuration: '5000ms' } : undefined}
                  onAnimationEnd={!isVideo ? goNext : undefined}
                />
              )}
            </div>
          ))}
        </div>

        {/* User info row */}
        <div className="flex items-center gap-2">
          <div className="size-8 overflow-hidden rounded-full bg-muted">
            {currentGroup.user.avatarUrl ? (
              <img
                src={currentGroup.user.avatarUrl}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              <span className="flex size-full items-center justify-center text-xs font-medium text-white">
                {currentGroup.user.displayName?.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <span className="text-sm font-semibold text-white">
            {currentGroup.user.username}
          </span>
          <span className="text-xs text-white/70">{relativeTime}</span>
          <div className="flex-1" />
          {isOwnStory && (
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex size-8 items-center justify-center rounded-full hover:bg-white/20"
              aria-label="Menu"
            >
              <MoreHorizontal className="size-5 text-white" />
            </button>
          )}
          <button
            onClick={handleClose}
            className="flex size-8 items-center justify-center rounded-full hover:bg-white/20"
            aria-label="Dong"
          >
            <X className="size-5 text-white" />
          </button>
        </div>
      </div>

      {/* Menu dropdown for own stories */}
      {showMenu && isOwnStory && (
        <div className="absolute right-3 top-20 z-10 rounded-lg bg-white/10 p-1 backdrop-blur-sm">
          <button
            onClick={() => {
              setShowMenu(false);
              setShowDeleteDialog(true);
            }}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-white hover:bg-white/20"
          >
            <Trash2 className="size-4" />
            Xoa story
          </button>
        </div>
      )}

      {/* Touch zones */}
      <div
        className="absolute inset-y-0 left-0 w-[40%]"
        onClick={goPrev}
        aria-hidden="true"
      />
      <div
        className="absolute inset-y-0 right-0 w-[60%]"
        onClick={goNext}
        aria-hidden="true"
      />

      {/* Bottom overlay for own stories - view count */}
      {isOwnStory && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent px-3 pb-4">
          <div className="flex items-center justify-center gap-1">
            <Eye className="size-4 text-white/80" />
            <span className="text-xs text-white/80">Luot xem</span>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoa story?</AlertDialogTitle>
            <AlertDialogDescription>
              Ban co chac muon xoa story nay? Hanh dong nay khong the hoan tac.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Xoa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
