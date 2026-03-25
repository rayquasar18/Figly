'use client';

import { Suspense } from 'react';
import { ReelFeed, ReelSkeleton } from '@/features/reel';

export function ReelsPageClient() {
  return (
    <div className="h-[calc(100dvh-56px)] md:h-dvh">
      <Suspense fallback={<ReelSkeleton />}>
        <ReelFeed />
      </Suspense>
    </div>
  );
}
