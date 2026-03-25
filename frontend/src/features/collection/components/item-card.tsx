'use client';

import Link from 'next/link';
import { Package, Check, Heart } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { ItemResponse } from '@figly/shared';

interface ItemCardProps {
  item: ItemResponse;
}

export function ItemCard({ item }: ItemCardProps) {
  return (
    <Link href={`/item/${item.id}`}>
      <Card className="group overflow-hidden transition-shadow hover:shadow-md">
        <div className="relative aspect-square bg-muted">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              <Package className="size-8 text-muted-foreground/50" />
            </div>
          )}

          {/* Status indicators */}
          <div className="absolute right-1.5 top-1.5 flex gap-1">
            {item.isOwned && (
              <div className="flex size-6 items-center justify-center rounded-full bg-green-500 text-white">
                <Check className="size-3.5" />
              </div>
            )}
            {item.isWishlisted && (
              <div className="flex size-6 items-center justify-center rounded-full bg-rose-500 text-white">
                <Heart className="size-3.5 fill-current" />
              </div>
            )}
          </div>
        </div>
        <div className="p-2">
          <h4 className="line-clamp-2 text-sm font-medium leading-tight group-hover:text-primary">
            {item.name}
          </h4>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {item.seriesName}
          </p>
        </div>
      </Card>
    </Link>
  );
}
