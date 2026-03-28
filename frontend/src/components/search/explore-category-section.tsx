'use client';

import Link from 'next/link';
import type { ExploreCategorySection } from '@figly/shared';

interface ExploreCategorySectionProps {
  section: ExploreCategorySection;
  onOpenPost: (id: string) => void;
}

export function ExploreCategorySectionComponent({
  section,
  onOpenPost,
}: ExploreCategorySectionProps) {
  return (
    <div className="mb-6">
      {/* Section header */}
      <div className="flex items-center justify-between px-4 mb-2">
        <h2 className="text-lg font-bold">{section.category.name}</h2>
        <Link
          href={`/collection/${section.category.slug}`}
          className="text-sm text-primary hover:underline"
        >
          Xem tat ca
        </Link>
      </div>

      {/* Post thumbnail grid: 3 columns, max 9 posts */}
      <div className="grid grid-cols-3 gap-0.5">
        {section.posts.slice(0, 9).map((post) => {
          const firstMedia = post.media?.[0];
          const imageUrl = firstMedia?.url;

          return (
            <button
              key={post.id}
              onClick={() => onOpenPost(post.id)}
              className="relative aspect-square overflow-hidden"
            >
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <div className="size-full bg-gradient-to-br from-muted to-muted-foreground/20" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
