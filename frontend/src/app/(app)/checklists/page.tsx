'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useMyChecklists } from '@/hooks/queries/checklist-queries';
import { ChecklistCard } from '@/components/checklist/checklist-card';

function ChecklistGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-3 rounded-lg border p-4">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      ))}
    </div>
  );
}

export default function ChecklistsPage() {
  const { data: checklists, isLoading } = useMyChecklists();

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">Checklist cua toi</h1>
        <Button asChild size="sm">
          <Link href="/checklists/new">
            <Plus className="mr-1.5 size-4" />
            Tao checklist moi
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <ChecklistGridSkeleton />
      ) : checklists && checklists.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {checklists.map((checklist) => (
            <ChecklistCard key={checklist.id} checklist={checklist} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-muted-foreground">
            Ban chua co checklist nao
          </p>
          <Button asChild className="mt-4" size="sm">
            <Link href="/checklists/new">
              <Plus className="mr-1.5 size-4" />
              Tao checklist moi
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
