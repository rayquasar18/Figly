'use client';

import { useCategories } from '@/hooks/queries/collection-queries';
import { CategoryCard } from '@/components/collection/category-card';
import { ItemSearch } from '@/components/collection/item-search';
import { Skeleton } from '@/components/ui/skeleton';

function CategoryGridSkeleton() {
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

export default function CollectionPageClient() {
  const { data: categories, isLoading } = useCategories();

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="mb-6 text-xl font-bold">Bo suu tap</h1>

      {/* Search bar */}
      <div className="mb-6">
        <ItemSearch />
      </div>

      {/* Separator */}
      <div className="mb-4 border-t pt-4">
        <h2 className="text-base font-semibold text-muted-foreground">Danh muc</h2>
      </div>

      {isLoading ? (
        <CategoryGridSkeleton />
      ) : categories && categories.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-muted-foreground">Chua co danh muc nao</p>
        </div>
      )}
    </div>
  );
}
