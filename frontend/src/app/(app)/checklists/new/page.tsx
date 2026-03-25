'use client';

import { useRouter } from 'next/navigation';
import { useCreateChecklist, ChecklistForm } from '@/features/checklist';
import type { CreateChecklistDto } from '@figly/shared';

export default function CreateChecklistPage() {
  const router = useRouter();
  const createChecklist = useCreateChecklist();

  function handleSubmit(data: CreateChecklistDto) {
    createChecklist.mutate(data, {
      onSuccess: (checklist) => {
        router.push(`/checklists/${checklist.id}`);
      },
    });
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <h1 className="mb-6 text-xl font-bold">Tao checklist moi</h1>
      <ChecklistForm
        onSubmit={handleSubmit}
        isPending={createChecklist.isPending}
      />
    </div>
  );
}
