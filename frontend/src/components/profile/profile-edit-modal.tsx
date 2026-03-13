'use client';

import type { ProfileResponse } from '@figly/shared';

interface ProfileEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: ProfileResponse;
}

/**
 * Stub: replaced in Task 2 with full edit profile modal.
 */
export function ProfileEditModal({
  open,
  onOpenChange,
  profile: _profile,
}: ProfileEditModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={() => onOpenChange(false)}
      role="dialog"
      aria-label="Chinh sua trang ca nhan"
    >
      <div
        className="rounded-lg bg-background p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <p>Loading editor...</p>
      </div>
    </div>
  );
}
