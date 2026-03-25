'use client';

import Link from 'next/link';
import { Globe } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { ChecklistResponse } from '@figly/shared';

interface ChecklistCardProps {
  checklist: ChecklistResponse;
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Vua xong';
  if (minutes < 60) return `${minutes} phut truoc`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} gio truoc`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngay truoc`;
  const months = Math.floor(days / 30);
  return `${months} thang truoc`;
}

export function ChecklistCard({ checklist }: ChecklistCardProps) {
  const progressPercent =
    checklist.totalEntries > 0
      ? Math.round((checklist.checkedEntries / checklist.totalEntries) * 100)
      : 0;

  return (
    <Link href={`/checklists/${checklist.id}`}>
      <Card className="p-4 transition-shadow hover:shadow-md">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 font-semibold leading-tight">{checklist.name}</h3>
          {checklist.isPublic && <Globe className="size-4 shrink-0 text-muted-foreground" />}
        </div>

        <div className="mt-3 space-y-1.5">
          <Progress value={progressPercent} className="h-2" />
          <p className="text-sm text-muted-foreground">
            {checklist.checkedEntries}/{checklist.totalEntries} hoan thanh
          </p>
        </div>

        <p className="mt-2 text-xs text-muted-foreground">
          {formatRelativeTime(checklist.updatedAt)}
        </p>
      </Card>
    </Link>
  );
}
