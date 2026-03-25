'use client';

import Link from 'next/link';
import { FollowerList } from '@/features/social';

interface FollowingPageClientProps {
  username: string;
}

export default function FollowingPageClient({ username }: FollowingPageClientProps) {
  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      {/* Header with back arrow */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href={`/${username}`}
          className="flex size-9 items-center justify-center rounded-full hover:bg-accent"
          aria-label="Quay lai trang ca nhan"
        >
          <svg
            className="size-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
            />
          </svg>
        </Link>
        <h1 className="text-balance text-xl font-semibold">Dang theo doi</h1>
      </div>

      <FollowerList username={username} type="following" />
    </div>
  );
}
