'use client';

import Link from 'next/link';
import { Package } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { CategoryResponse } from '@figly/shared';

interface CategoryCardProps {
  category: CategoryResponse;
}

export function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link href={`/collection/${category.slug}`}>
      <Card className="group overflow-hidden transition-shadow hover:shadow-md">
        <div className="relative aspect-[4/3] bg-muted">
          {category.coverImage ? (
            <img
              src={category.coverImage}
              alt={category.name}
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              <Package className="size-12 text-muted-foreground/50" />
            </div>
          )}
        </div>
        <CardContent className="p-3">
          <h3 className="font-semibold leading-tight group-hover:text-primary">
            {category.name}
          </h3>
          {category.description && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {category.description}
            </p>
          )}
          <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
            <span>{category.seriesCount} bo</span>
            <span>{category.itemCount} vat pham</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
