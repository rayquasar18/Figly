'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function FeedSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="border-b pb-4">
          {/* Author header skeleton */}
          <div className="flex items-center gap-3 px-3 py-2">
            <Skeleton className="size-8 rounded-full" />
            <Skeleton className="h-3.5 w-24" />
            <div className="flex-1" />
            <Skeleton className="h-3 w-16" />
          </div>

          {/* Image skeleton */}
          <Skeleton className="aspect-square w-full" />

          {/* Action buttons skeleton */}
          <div className="flex items-center gap-3 px-3 pt-2">
            <Skeleton className="size-6 rounded" />
            <Skeleton className="size-6 rounded" />
            <div className="flex-1" />
            <Skeleton className="size-6 rounded" />
          </div>

          {/* Like count skeleton */}
          <div className="px-3 pt-1">
            <Skeleton className="h-3.5 w-20" />
          </div>

          {/* Caption skeleton */}
          <div className="space-y-1 px-3 pt-2">
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
