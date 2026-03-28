'use client';

import { FeedList } from '@/components/feed/feed-list';
import { StoryBar } from '@/components/story/story-bar';
import { CreateStoryFlow } from '@/components/story/create-story-flow';

export default function FeedPage() {
  return (
    <div className="mx-auto max-w-[470px] pb-16">
      <StoryBar />
      <FeedList />
      <CreateStoryFlow />
    </div>
  );
}
