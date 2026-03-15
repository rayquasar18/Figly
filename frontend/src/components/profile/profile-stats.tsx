'use client';

import Link from 'next/link';

interface ProfileStatsProps {
  username: string;
  postCount: number;
  followerCount: number;
  followingCount: number;
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return String(num);
}

export function ProfileStats({
  username,
  postCount,
  followerCount,
  followingCount,
}: ProfileStatsProps) {
  return (
    <div className="flex gap-6">
      <div className="flex flex-col items-center">
        <span className="text-lg font-semibold tabular-nums">
          {formatNumber(postCount)}
        </span>
        <span className="text-xs text-muted-foreground">bai viet</span>
      </div>

      <Link
        href={`/${username}/followers`}
        className="flex flex-col items-center hover:opacity-80 transition-opacity"
      >
        <span className="text-lg font-semibold tabular-nums">
          {formatNumber(followerCount)}
        </span>
        <span className="text-xs text-muted-foreground">nguoi theo doi</span>
      </Link>

      <Link
        href={`/${username}/following`}
        className="flex flex-col items-center hover:opacity-80 transition-opacity"
      >
        <span className="text-lg font-semibold tabular-nums">
          {formatNumber(followingCount)}
        </span>
        <span className="text-xs text-muted-foreground">dang theo doi</span>
      </Link>
    </div>
  );
}
