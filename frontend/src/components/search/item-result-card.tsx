'use client';

import Link from 'next/link';
import { Package } from 'lucide-react';
import type { ItemResponse } from '@figly/shared';

interface ItemResultCardProps {
  item: ItemResponse;
}

export function ItemResultCard({ item }: ItemResultCardProps) {
  return (
    <Link
      href={`/item/${item.id}`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors"
    >
      {item.imageUrl ? (
        <img
          src={item.imageUrl}
          alt={item.name}
          className="size-8 rounded object-cover"
        />
      ) : (
        <div className="flex size-8 items-center justify-center rounded bg-muted">
          <Package className="size-4 text-muted-foreground" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold truncate">{item.name}</p>
        <p className="text-xs text-muted-foreground truncate">
          {item.seriesName} &middot; {item.categoryName}
        </p>
      </div>
    </Link>
  );
}
