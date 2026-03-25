'use client';

import Link from 'next/link';
import { Package, ListChecks } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton';
import { ItemCard } from './item-card';
import { useAuthStore } from '@/features/auth';
import type { ItemResponse } from '@figly/shared';

interface CollectionShowcaseProps {
  username: string;
}

interface OwnedItemsResponse {
  items: ItemResponse[];
  totalCount: number;
}

function useOwnedItems(username: string) {
  return useQuery({
    queryKey: ['ownedItems', username],
    queryFn: async () => {
      const response = await apiClient.get<OwnedItemsResponse>(
        `/collection/users/${username}/owned`,
      );
      return response.data;
    },
    enabled: !!username,
  });
}

function groupByCategory(items: ItemResponse[]): Map<string, ItemResponse[]> {
  const map = new Map<string, ItemResponse[]>();
  for (const item of items) {
    const cat = item.categoryName;
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push(item);
  }
  return map;
}

function ShowcaseSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-5 w-1/3" />
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="space-y-1.5">
                <Skeleton className="aspect-square w-full rounded-lg" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function CollectionShowcase({ username }: CollectionShowcaseProps) {
  const { data, isLoading } = useOwnedItems(username);
  const currentUser = useAuthStore((s) => s.user);
  const isOwnProfile = currentUser?.username === username;

  if (isLoading) {
    return <ShowcaseSkeleton />;
  }

  const items = data?.items ?? [];

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Package className="mb-3 size-12 text-muted-foreground/40" />
        <p className="text-muted-foreground">Chua co vat pham nao</p>
        {isOwnProfile && (
          <Link
            href="/collection"
            className="mt-3 text-sm text-primary hover:underline"
          >
            Kham pha bo suu tap
          </Link>
        )}
      </div>
    );
  }

  const grouped = groupByCategory(items);

  return (
    <div className="space-y-6">
      {/* Own profile: show count + link to checklists */}
      {isOwnProfile && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {data?.totalCount ?? items.length} vat pham
          </p>
          <Link
            href="/checklists"
            className="flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <ListChecks className="size-4" />
            Xem checklist
          </Link>
        </div>
      )}

      {Array.from(grouped.entries()).map(([categoryName, categoryItems]) => (
        <div key={categoryName}>
          <h3 className="mb-3 text-sm font-semibold capitalize">
            {categoryName}
          </h3>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
            {categoryItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
