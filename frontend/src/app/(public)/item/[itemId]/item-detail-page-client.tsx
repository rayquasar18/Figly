'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useItemDetail, ItemDetail } from '@/features/collection';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

function ItemDetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="aspect-square w-full rounded-lg" />
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

interface ItemDetailPageClientProps {
  itemId: string;
}

export default function ItemDetailPageClient({ itemId }: ItemDetailPageClientProps) {
  const router = useRouter();
  const { data: item, isLoading, isError } = useItemDetail(itemId);

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => router.back()} className="-ml-2 mb-4">
        <ArrowLeft className="mr-1 size-4" />
        Quay lai
      </Button>

      {isLoading ? (
        <ItemDetailSkeleton />
      ) : isError || !item ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-muted-foreground">Khong tim thay vat pham</p>
        </div>
      ) : (
        <ItemDetail item={item} />
      )}
    </div>
  );
}
