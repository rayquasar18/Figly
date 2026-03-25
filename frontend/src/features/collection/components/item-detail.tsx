'use client';

import Link from 'next/link';
import { Package, ArrowLeft, Users } from 'lucide-react';
import { OwnedWishlistToggle } from './owned-wishlist-toggle';
import type { ItemDetailResponse } from '@figly/shared';

interface ItemDetailProps {
  item: ItemDetailResponse;
}

export function ItemDetail({ item }: ItemDetailProps) {
  return (
    <div className="space-y-4">
      {/* Image */}
      <div className="aspect-square w-full overflow-hidden rounded-lg bg-muted">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <Package className="size-20 text-muted-foreground/30" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="space-y-3 px-1">
        <h1 className="text-xl font-bold">{item.name}</h1>

        {/* Breadcrumb links */}
        <div className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          <Link
            href={`/collection/${item.categorySlug}`}
            className="hover:text-primary hover:underline"
          >
            {item.categoryName}
          </Link>
          <span>/</span>
          <Link
            href={`/collection/${item.categorySlug}/${item.seriesSlug}`}
            className="hover:text-primary hover:underline"
          >
            {item.seriesName}
          </Link>
        </div>

        {item.description && (
          <p className="text-sm text-muted-foreground">{item.description}</p>
        )}

        {item.releaseDate && (
          <p className="text-sm text-muted-foreground">
            Ngay phat hanh:{' '}
            {new Date(item.releaseDate).toLocaleDateString('vi-VN')}
          </p>
        )}

        {/* Social proof */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Users className="size-4" />
          <span>{item.ownerCount} nguoi so huu</span>
        </div>

        {/* Toggle buttons */}
        <OwnedWishlistToggle
          itemId={item.id}
          isOwned={item.isOwned}
          isWishlisted={item.isWishlisted}
        />
      </div>
    </div>
  );
}
