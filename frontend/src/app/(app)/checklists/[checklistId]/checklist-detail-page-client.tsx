'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  useChecklistDetail,
  useUpdateChecklist,
  useDeleteChecklist,
  useAddEntry,
  useToggleEntry,
  useRemoveEntry,
  useReorderEntries,
  ChecklistEntry,
} from '@/features/checklist';
import { ItemPicker } from '@/features/collection';
import type { LinkedItemResponse } from '@figly/shared';

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-7 w-2/3" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-4 w-1/4" />
      <div className="mt-6 space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

interface ChecklistDetailPageClientProps {
  checklistId: string;
}

export function ChecklistDetailPageClient({ checklistId }: ChecklistDetailPageClientProps) {
  const router = useRouter();
  const { data: checklist, isLoading } = useChecklistDetail(checklistId);
  const updateChecklist = useUpdateChecklist();
  const deleteChecklist = useDeleteChecklist();
  const addEntry = useAddEntry();
  const toggleEntry = useToggleEntry();
  const removeEntry = useRemoveEntry();
  const reorderEntries = useReorderEntries();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [freeformText, setFreeformText] = useState('');
  const [itemPickerOpen, setItemPickerOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <DetailSkeleton />
      </div>
    );
  }

  if (!checklist) {
    return (
      <div className="flex min-h-[50dvh] flex-col items-center justify-center text-center">
        <h2 className="text-xl font-semibold">Checklist khong ton tai</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Checklist nay khong ton tai hoac ban khong co quyen truy cap.
        </p>
      </div>
    );
  }

  const progressPercent =
    checklist.totalEntries > 0
      ? Math.round((checklist.checkedEntries / checklist.totalEntries) * 100)
      : 0;

  const sortedEntries = [...checklist.entries].sort((a, b) => a.position - b.position);

  function handleStartEdit() {
    setEditName(checklist!.name);
    setIsEditing(true);
  }

  function handleSaveEdit() {
    if (!editName.trim()) return;
    updateChecklist.mutate(
      { checklistId, data: { name: editName.trim() } },
      { onSuccess: () => setIsEditing(false) },
    );
  }

  function handleDelete() {
    deleteChecklist.mutate({ checklistId }, { onSuccess: () => router.push('/checklists') });
  }

  function handleAddFreeform() {
    const text = freeformText.trim();
    if (!text) return;
    addEntry.mutate(
      { checklistId, data: { freeformText: text } },
      { onSuccess: () => setFreeformText('') },
    );
  }

  function handleAddItem(ids: string[], _items?: LinkedItemResponse[]) {
    if (ids.length === 0) return;
    addEntry.mutate({ checklistId, data: { itemId: ids[0] } });
  }

  function handleToggle(entryId: string) {
    toggleEntry.mutate({ entryId, checklistId });
  }

  function handleRemove(entryId: string) {
    removeEntry.mutate({ entryId, checklistId });
  }

  function handleMoveUp(index: number) {
    if (index <= 0) return;
    const newOrder = [...sortedEntries];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    reorderEntries.mutate({
      checklistId,
      entryIds: newOrder.map((e) => e.id),
    });
  }

  function handleMoveDown(index: number) {
    if (index >= sortedEntries.length - 1) return;
    const newOrder = [...sortedEntries];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    reorderEntries.mutate({
      checklistId,
      entryIds: newOrder.map((e) => e.id),
    });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-2">
        {isEditing ? (
          <div className="flex flex-1 items-center gap-2">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="text-lg font-bold"
              maxLength={100}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveEdit();
                if (e.key === 'Escape') setIsEditing(false);
              }}
            />
            <Button size="sm" onClick={handleSaveEdit} disabled={updateChecklist.isPending}>
              Luu
            </Button>
          </div>
        ) : (
          <h1 className="text-xl font-bold">{checklist.name}</h1>
        )}

        <div className="flex shrink-0 items-center gap-1">
          {!isEditing && (
            <Button variant="ghost" size="icon" onClick={handleStartEdit}>
              <Pencil className="size-4" />
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Xoa checklist?</AlertDialogTitle>
                <AlertDialogDescription>
                  Hanh dong nay khong the hoan tac. Tat ca muc trong checklist se bi xoa.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Huy</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Xoa
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6 space-y-1.5">
        <Progress value={progressPercent} className="h-2.5" />
        <p className="text-sm text-muted-foreground">
          {checklist.checkedEntries}/{checklist.totalEntries} hoan thanh
        </p>
      </div>

      {/* Entry list */}
      <div className="space-y-2">
        {sortedEntries.map((entry, index) => (
          <ChecklistEntry
            key={entry.id}
            entry={entry}
            isFirst={index === 0}
            isLast={index === sortedEntries.length - 1}
            onToggle={() => handleToggle(entry.id)}
            onMoveUp={() => handleMoveUp(index)}
            onMoveDown={() => handleMoveDown(index)}
            onDelete={() => handleRemove(entry.id)}
          />
        ))}
      </div>

      {/* Add entry section */}
      <div className="mt-6 space-y-3 rounded-lg border p-4">
        <h3 className="text-sm font-semibold">Them muc</h3>

        {/* Add from database via ItemPicker */}
        <Button
          size="sm"
          variant="outline"
          onClick={() => setItemPickerOpen(true)}
          disabled={addEntry.isPending}
          className="gap-1.5"
        >
          <Search className="size-4" />
          Them tu database
        </Button>

        <ItemPicker
          mode="single"
          selectedItemIds={[]}
          onSelect={handleAddItem}
          open={itemPickerOpen}
          onOpenChange={setItemPickerOpen}
        />

        {/* Add freeform */}
        <div className="flex items-center gap-2">
          <Input
            placeholder="Them muc tu do..."
            value={freeformText}
            onChange={(e) => setFreeformText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddFreeform();
            }}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={handleAddFreeform}
            disabled={!freeformText.trim() || addEntry.isPending}
          >
            <Plus className="mr-1 size-4" />
            Them tu do
          </Button>
        </div>
      </div>
    </div>
  );
}
