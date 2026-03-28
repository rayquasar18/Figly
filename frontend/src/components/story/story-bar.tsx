'use client';

import { useState } from 'react';
import { useStoryFeed } from '@/hooks/queries/story-queries';
import { useCreateStoryStore } from '@/stores/create-story-store';
import { StoryAvatar } from './story-avatar';
import { StoryViewer } from './story-viewer';
import { Skeleton } from '@/components/ui/skeleton';
import type { StoryGroupResponse } from '@figly/shared';

export function StoryBar() {
  const { data, isLoading } = useStoryFeed();
  const openCreateFlow = useCreateStoryStore((s) => s.openFlow);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);

  // Combine all groups: own stories first, then followed
  const allGroups: StoryGroupResponse[] = [];
  if (data?.myStories) allGroups.push(data.myStories);
  if (data?.followedStories) allGroups.push(...data.followedStories);

  const handleAvatarClick = (index: number) => {
    setActiveGroupIndex(index);
    setViewerOpen(true);
  };

  if (isLoading) {
    return (
      <div className="border-b px-4 py-3">
        <div className="flex gap-4 overflow-x-auto" role="list">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-1"
              role="listitem"
            >
              <Skeleton className="size-16 rounded-full" />
              <Skeleton className="h-3 w-10" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Show bar if there are stories OR if user might want to create one
  return (
    <>
      <div className="border-b px-4 py-3">
        <div
          className="flex gap-4 overflow-x-auto scrollbar-hide"
          role="list"
        >
          {/* Add story button - always shown */}
          <div role="listitem">
            <StoryAvatar isAddButton onClick={openCreateFlow} />
          </div>
          {/* Story groups */}
          {allGroups.map((group, i) => (
            <div key={group.user.id} role="listitem">
              <StoryAvatar
                user={group.user}
                hasUnviewed={group.hasUnviewed}
                onClick={() => handleAvatarClick(i)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Story viewer overlay */}
      {viewerOpen && allGroups.length > 0 && (
        <StoryViewer
          groups={allGroups}
          initialGroupIndex={activeGroupIndex}
          onClose={() => {
            setViewerOpen(false);
          }}
        />
      )}
    </>
  );
}
