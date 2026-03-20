'use client';

import { useCreateReelStore } from '@/stores/create-reel-store';

export function CreateReelFlow() {
  const isOpen = useCreateReelStore((s) => s.isOpen);

  if (!isOpen) return null;

  // Full implementation in Task 2
  return null;
}
