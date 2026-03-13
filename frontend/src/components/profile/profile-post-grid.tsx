'use client';

import { Camera } from 'lucide-react';

interface ProfilePostGridProps {
  posts?: Array<{
    id: string;
    thumbnailUrl: string;
  }>;
}

export function ProfilePostGrid({ posts = [] }: ProfilePostGridProps) {
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex size-16 items-center justify-center rounded-full border-2 border-muted-foreground/30">
          <Camera className="size-8 text-muted-foreground/50" />
        </div>
        <p className="mt-4 text-lg font-semibold">Chua co bai viet nao</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Khi chia se anh, anh se xuat hien tren trang ca nhan cua ban.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-0.5 md:gap-1">
      {posts.map((post) => (
        <button
          key={post.id}
          className="relative aspect-square overflow-hidden bg-muted"
          aria-label={`Xem bai viet ${post.id}`}
        >
          <img
            src={post.thumbnailUrl}
            alt=""
            className="size-full object-cover"
            loading="lazy"
          />
        </button>
      ))}
    </div>
  );
}
