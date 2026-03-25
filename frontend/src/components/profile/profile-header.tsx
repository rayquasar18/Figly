'use client';

import type { ProfileResponse } from '@figly/shared';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { FollowButton } from '@/components/social/follow-button';
import { ProfileStats } from './profile-stats';

interface ProfileHeaderProps {
  profile: ProfileResponse;
  onEditClick: () => void;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function ProfileHeader({ profile, onEditClick }: ProfileHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Top section: avatar + stats */}
      <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
        {/* Avatar */}
        <Avatar className="size-20 border md:size-36">
          <AvatarImage src={profile.avatarUrl ?? undefined} alt={profile.displayName} />
          <AvatarFallback className="text-xl font-medium md:text-3xl">
            {getInitials(profile.displayName)}
          </AvatarFallback>
        </Avatar>

        {/* Right column: stats + action button */}
        <div className="flex flex-1 flex-col items-center gap-4 md:items-start">
          {/* Username row + action button on desktop */}
          <div className="flex flex-col items-center gap-3 md:flex-row md:items-center">
            <h1 className="text-xl font-semibold">{profile.username}</h1>

            {profile.isOwnProfile ? (
              <Button variant="outline" size="sm" onClick={onEditClick}>
                Chinh sua trang ca nhan
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <FollowButton
                  userId={profile.id}
                  username={profile.username}
                  isFollowing={profile.isFollowing}
                  size="sm"
                />

                {profile.isFollowedBy && (
                  <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    Theo doi ban
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Stats */}
          <ProfileStats
            username={profile.username}
            postCount={profile.postCount}
            followerCount={profile.followerCount}
            followingCount={profile.followingCount}
          />
        </div>
      </div>

      {/* Name + bio section */}
      <div className="space-y-1">
        <p className="text-balance font-semibold">{profile.displayName}</p>
        {profile.bio && (
          <p className="whitespace-pre-line text-pretty text-sm text-muted-foreground">
            {profile.bio}
          </p>
        )}
      </div>
    </div>
  );
}
