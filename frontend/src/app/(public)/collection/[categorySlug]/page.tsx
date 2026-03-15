'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useSeriesByCategory, useCategories } from '@/hooks/queries/collection-queries';
import { SeriesCard } from '@/components/collection/series-card';
import { FollowSeriesButton } from '@/components/collection/follow-series-button';
import { Skeleton } from '@/components/ui/skeleton';

function SeriesGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-[4/3] w-full rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export default function CategorySeriesPage() {
  const params = useParams<{ categorySlug: string }>();
  const categorySlug = params.categorySlug;
  const { data: seriesList, isLoading } = useSeriesByCategory(categorySlug);
  const { data: categories } = useCategories();

  // Find current category for follow button
  const currentCategory = categories?.find((c) => c.slug === categorySlug);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/collection" className="hover:text-primary hover:underline">
          Bo suu tap
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="font-medium text-foreground">{categorySlug}</span>
      </nav>

      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold capitalize">
          {categorySlug.replace(/-/g, ' ')}
        </h1>
        {currentCategory && (
          <FollowSeriesButton
            type="category"
            id={currentCategory.id}
            isFollowed={false}
          />
        )}
      </div>

      {isLoading ? (
        <SeriesGridSkeleton />
      ) : seriesList && seriesList.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {seriesList.map((series) => (
            <SeriesCard
              key={series.id}
              series={series}
              categorySlug={categorySlug}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-muted-foreground">Chua co bo nao trong danh muc nay</p>
        </div>
      )}
    </div>
  );
}
