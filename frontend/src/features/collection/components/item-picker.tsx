'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Search, X, Package, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSearchItems } from '../hooks/collection-queries';
import type { ItemResponse, LinkedItemResponse } from '@figly/shared';

interface ItemPickerProps {
  mode: 'single' | 'multi';
  selectedItemIds: string[];
  onSelect: (ids: string[], items?: LinkedItemResponse[]) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ItemPicker({
  mode,
  selectedItemIds,
  onSelect,
  open,
  onOpenChange,
}: ItemPickerProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [localSelectedIds, setLocalSelectedIds] = useState<Set<string>>(new Set(selectedItemIds));
  const [localSelectedItems, setLocalSelectedItems] = useState<Map<string, LinkedItemResponse>>(
    new Map(),
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Reset local state when dialog opens
  useEffect(() => {
    if (open) {
      setLocalSelectedIds(new Set(selectedItemIds));
      setQuery('');
      setDebouncedQuery('');
    }
  }, [open, selectedItemIds]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useSearchItems(debouncedQuery);

  // Infinite scroll observer
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allItems = useMemo(() => {
    if (!data) return [];
    return data.pages.flatMap((page) => page.items);
  }, [data]);

  const toLinkedItem = useCallback(
    (item: ItemResponse): LinkedItemResponse => ({
      id: item.id,
      name: item.name,
      seriesName: item.seriesName,
      categoryName: item.categoryName,
      imageUrl: item.imageUrl,
    }),
    [],
  );

  const handleItemClick = useCallback(
    (item: ItemResponse) => {
      if (mode === 'single') {
        const linked = toLinkedItem(item);
        onSelect([item.id], [linked]);
        onOpenChange(false);
        return;
      }

      // Multi mode: toggle selection
      setLocalSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(item.id)) {
          next.delete(item.id);
        } else {
          next.add(item.id);
        }
        return next;
      });
      setLocalSelectedItems((prev) => {
        const next = new Map(prev);
        if (next.has(item.id)) {
          next.delete(item.id);
        } else {
          next.set(item.id, toLinkedItem(item));
        }
        return next;
      });
    },
    [mode, onSelect, onOpenChange, toLinkedItem],
  );

  const handleDone = useCallback(() => {
    const ids = Array.from(localSelectedIds);
    const items = Array.from(localSelectedItems.values());
    onSelect(ids, items);
    onOpenChange(false);
  }, [localSelectedIds, localSelectedItems, onSelect, onOpenChange]);

  const handleRemoveSelected = useCallback((itemId: string) => {
    setLocalSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });
    setLocalSelectedItems((prev) => {
      const next = new Map(prev);
      next.delete(itemId);
      return next;
    });
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[80vh] max-w-md flex-col gap-0 p-0">
        <DialogTitle className="px-4 pt-4 text-base font-semibold">
          {mode === 'single' ? 'Chon vat pham' : 'Lien ket vat pham'}
        </DialogTitle>

        {/* Search input */}
        <div className="relative px-4 py-3">
          <Search className="absolute left-7 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tim kiem vat pham..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Selected items chips (multi mode only) */}
        {mode === 'multi' && localSelectedIds.size > 0 && (
          <div className="flex flex-wrap gap-1.5 px-4 pb-2">
            {Array.from(localSelectedItems.values()).map((item) => (
              <Badge key={item.id} variant="secondary" className="flex items-center gap-1">
                {item.name}
                <button
                  type="button"
                  onClick={() => handleRemoveSelected(item.id)}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-muted"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Search results */}
        <ScrollArea className="flex-1 border-t">
          <div className="max-h-[400px] min-h-[200px]">
            {debouncedQuery.length === 0 && (
              <div className="flex h-[200px] flex-col items-center justify-center text-sm text-muted-foreground">
                <Package className="mb-2 size-8" />
                <p>Nhap ten vat pham de tim kiem</p>
              </div>
            )}

            {debouncedQuery.length > 0 && isLoading && (
              <div className="flex h-[200px] items-center justify-center">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {debouncedQuery.length > 0 && !isLoading && allItems.length === 0 && (
              <div className="flex h-[200px] flex-col items-center justify-center text-sm text-muted-foreground">
                <p>Khong tim thay vat pham nao</p>
              </div>
            )}

            {allItems.map((item) => {
              const isSelected = localSelectedIds.has(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleItemClick(item)}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-accent ${
                    isSelected ? 'bg-accent/50' : ''
                  }`}
                >
                  {/* Item image or placeholder */}
                  <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="size-full object-cover" />
                    ) : (
                      <Package className="size-5 text-muted-foreground" />
                    )}
                  </div>

                  {/* Item info */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.seriesName} &middot; {item.categoryName}
                    </p>
                  </div>

                  {/* Selection indicator */}
                  {mode === 'multi' && (
                    <div
                      className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 ${
                        isSelected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted-foreground/30'
                      }`}
                    >
                      {isSelected && (
                        <svg
                          className="size-3"
                          viewBox="0 0 12 12"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M2 6l3 3 5-5" />
                        </svg>
                      )}
                    </div>
                  )}
                </button>
              );
            })}

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-4" />
            {isFetchingNextPage && (
              <div className="flex justify-center py-2">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Done button (multi mode only) */}
        {mode === 'multi' && (
          <div className="border-t px-4 py-3">
            <Button className="w-full" onClick={handleDone}>
              Xong ({localSelectedIds.size} da chon)
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
