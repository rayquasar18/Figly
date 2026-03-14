'use client';

import { Users } from 'lucide-react';

export function EmptyFeed() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex size-16 items-center justify-center rounded-full border-2 border-muted-foreground/30">
        <Users className="size-8 text-muted-foreground/50" />
      </div>
      <p className="mt-4 text-lg font-semibold">Theo doi nguoi khac de xem bai viet</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Khi ban theo doi ai do, bai viet cua ho se hien thi tai day.
      </p>
    </div>
  );
}
