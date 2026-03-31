'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { ChevronRight, Loader2 } from 'lucide-react';
import {
  useItemsBySeries,
  useSeriesByCategory,
  ItemCard,
  FollowSeriesButton,
} from '@/features/collection';
import { Skeleton } from '@/components/ui/skeleton';

function ItemGridSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <Skeleton className="aspect-square w-full rounded-lg" />
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-2.5 w-1/2" />
        </div>
      ))}
    </div>
  );
}

interface SeriesItemsPageClientProps {
  categorySlug: string;
  seriesSlug: string;
}

export default function SeriesItemsPageClient({
  categorySlug,
  seriesSlug,
}: SeriesItemsPageClientProps) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useItemsBySeries(
    categorySlug,
    seriesSlug,
  );
  const { data: seriesList } = useSeriesByCategory(categorySlug);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Find current series from the category's series list for follow button
  const currentSeries = seriesList?.find((s) => s.slug === seriesSlug);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const items = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/collection" className="hover:text-primary hover:underline">
          Bo suu tap
        </Link>
        <ChevronRight className="size-3.5" />
        <Link href={`/collection/${categorySlug}`} className="hover:text-primary hover:underline">
          {categorySlug.replace(/-/g, ' ')}
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="font-medium text-foreground">{seriesSlug.replace(/-/g, ' ')}</span>
      </nav>

      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold capitalize">{seriesSlug.replace(/-/g, ' ')}</h1>
        {currentSeries && (
          <FollowSeriesButton
            type="series"
            id={currentSeries.id}
            isFollowed={currentSeries.isFollowed ?? false}
          />
        )}
      </div>

      {isLoading ? (
        <ItemGridSkeleton />
      ) : items.length > 0 ? (
        <>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>

          {/* Sentinel for infinite scroll */}
          <div ref={sentinelRef} className="h-px" />

          {isFetchingNextPage && (
            <div className="flex justify-center py-6">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-muted-foreground">Chua co vat pham nao trong bo nay</p>
        </div>
      )}
    </div>
  );
}
