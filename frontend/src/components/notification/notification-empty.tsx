'use client';

import { BellOff } from 'lucide-react';

export function NotificationEmpty() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
      <BellOff className="size-16 stroke-1" />
      <p className="text-base font-medium">Chua co thong bao nao</p>
      <p className="text-sm text-center max-w-[260px]">
        Khi ai do tuong tac voi ban, thong bao se xuat hien o day
      </p>
    </div>
  );
}
