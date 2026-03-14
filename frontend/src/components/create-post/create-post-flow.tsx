'use client';

import { useCreatePostStore } from '@/stores/create-post-store';

/**
 * Multi-step post creation flow (gallery -> edit -> caption -> publish).
 * Full-screen overlay, only rendered when isOpen is true.
 * Full implementation in Task 2.
 */
export function CreatePostFlow() {
  const isOpen = useCreatePostStore((s) => s.isOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Full implementation in Task 2 */}
    </div>
  );
}
