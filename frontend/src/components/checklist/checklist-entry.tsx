'use client';

import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown, Trash2, Package } from 'lucide-react';
import type { ChecklistEntryResponse } from '@figly/shared';
import { cn } from '@/lib/utils';

interface ChecklistEntryProps {
  entry: ChecklistEntryResponse;
  isFirst: boolean;
  isLast: boolean;
  onToggle: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}

export function ChecklistEntry({
  entry,
  isFirst,
  isLast,
  onToggle,
  onMoveUp,
  onMoveDown,
  onDelete,
}: ChecklistEntryProps) {
  const displayName = entry.itemName ?? entry.freeformText ?? '';

  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <Checkbox checked={entry.isChecked} onCheckedChange={onToggle} className="shrink-0" />

      <div className="flex min-w-0 flex-1 items-center gap-2">
        {entry.itemId && (
          <div className="size-8 shrink-0 overflow-hidden rounded bg-muted">
            {entry.itemImageUrl ? (
              <img src={entry.itemImageUrl} alt={displayName} className="size-full object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center">
                <Package className="size-4 text-muted-foreground/50" />
              </div>
            )}
          </div>
        )}

        {entry.itemId ? (
          <Link
            href={`/item/${entry.itemId}`}
            className={cn(
              'truncate text-sm hover:text-primary hover:underline',
              entry.isChecked && 'text-muted-foreground line-through',
            )}
          >
            {displayName}
          </Link>
        ) : (
          <span
            className={cn(
              'truncate text-sm',
              entry.isChecked && 'text-muted-foreground line-through',
            )}
          >
            {displayName}
          </span>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={onMoveUp}
          disabled={isFirst}
        >
          <ChevronUp className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={onMoveDown}
          disabled={isLast}
        >
          <ChevronDown className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}
