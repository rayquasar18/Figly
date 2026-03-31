'use client';

import Link from 'next/link';
import { Package } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { SeriesResponse } from '@figly/shared';

interface SeriesCardProps {
  series: SeriesResponse;
  categorySlug: string;
}

export function SeriesCard({ series, categorySlug }: SeriesCardProps) {
  return (
    <Link href={`/collection/${categorySlug}/${series.slug}`}>
      <Card className="group overflow-hidden transition-shadow hover:shadow-md">
        <div className="relative aspect-[4/3] bg-muted">
          {series.coverImage ? (
            <img src={series.coverImage} alt={series.name} className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center">
              <Package className="size-10 text-muted-foreground/50" />
            </div>
          )}
          <div className="absolute bottom-2 right-2 rounded-full bg-background/80 px-2 py-0.5 text-xs font-medium backdrop-blur-sm">
            {series.itemCount} vat pham
          </div>
        </div>
        <CardContent className="p-3">
          <h3 className="font-semibold leading-tight group-hover:text-primary">{series.name}</h3>
          {series.description && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{series.description}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
