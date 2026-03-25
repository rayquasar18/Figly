'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function ProfileSkeleton() {
  return (
    <div className="mx-auto w-full max-w-4xl p-4 md:p-6">
      <div className="space-y-4">
        {/* Top section: avatar + stats */}
        <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
          {/* Avatar skeleton */}
          <Skeleton className="size-20 rounded-full md:size-36" />

          {/* Right column */}
          <div className="flex flex-1 flex-col items-center gap-4 md:items-start">
            {/* Username + button */}
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-8 w-40" />
            </div>

            {/* Stats */}
            <div className="flex gap-6">
              <div className="flex flex-col items-center gap-1">
                <Skeleton className="h-5 w-10" />
                <Skeleton className="h-3 w-12" />
              </div>
              <div className="flex flex-col items-center gap-1">
                <Skeleton className="h-5 w-10" />
                <Skeleton className="h-3 w-20" />
              </div>
              <div className="flex flex-col items-center gap-1">
                <Skeleton className="h-5 w-10" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </div>
        </div>

        {/* Name + bio skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-4 w-48" />
        </div>

        {/* Tabs skeleton */}
        <Skeleton className="mt-4 h-10 w-full" />

        {/* Grid skeleton */}
        <div className="grid grid-cols-3 gap-0.5 md:gap-1">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square" />
          ))}
        </div>
      </div>
    </div>
  );
}
