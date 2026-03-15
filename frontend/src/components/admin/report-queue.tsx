'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReportCard } from './report-card';
import { useReportQueue } from '@/hooks/queries/admin-queries';

export function ReportQueue() {
  const [sort, setSort] = useState<'newest' | 'most_reported'>('newest');
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useReportQueue(sort);

  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage],
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleObserver]);

  const allReports = data?.pages.flatMap((page) => page.items) ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sort toggle */}
      <div className="flex gap-2">
        <Button
          variant={sort === 'newest' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSort('newest')}
        >
          Moi nhat
        </Button>
        <Button
          variant={sort === 'most_reported' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSort('most_reported')}
        >
          Nhieu bao cao nhat
        </Button>
      </div>

      {/* Report list */}
      {allReports.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <Shield className="size-12" />
          <p>Khong co bao cao nao</p>
        </div>
      ) : (
        <div className="space-y-3">
          {allReports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-4" />
      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
    </div>
  );
}
