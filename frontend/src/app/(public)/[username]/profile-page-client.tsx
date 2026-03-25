'use client';

import { useState } from 'react';
import {
  useProfile,
  ProfileHeader,
  ProfilePostGrid,
  ProfileSkeleton,
  ProfileEditModal,
} from '@/features/profile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Grid3X3, Package, Clapperboard } from 'lucide-react';
import { CollectionShowcase } from '@/features/collection';
import { ProfileReelGrid } from '@/features/reel';
import type { ProfileResponse } from '@figly/shared';

interface ProfilePageClientProps {
  username: string;
  initialProfile: ProfileResponse | null;
}

export default function ProfilePageClient({ username, initialProfile }: ProfilePageClientProps) {
  const { data: profile, isLoading, isError } = useProfile(username);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Use server-fetched data as fallback while client query loads
  const displayProfile = profile ?? initialProfile;

  if (isLoading && !initialProfile) {
    return <ProfileSkeleton />;
  }

  if ((isError && !initialProfile) || !displayProfile) {
    return (
      <div className="flex min-h-[50dvh] flex-col items-center justify-center text-center">
        <h2 className="text-xl font-semibold">Nguoi dung khong ton tai</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Trang nay khong kha dung. Vui long kiem tra lai duong dan.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl p-4 md:p-6">
      <ProfileHeader profile={displayProfile} onEditClick={() => setEditModalOpen(true)} />

      <Tabs defaultValue="posts" className="mt-6">
        <TabsList className="w-full justify-center">
          <TabsTrigger value="posts" className="flex items-center gap-1.5">
            <Grid3X3 className="size-4" />
            <span className="text-xs uppercase tracking-wide">Bai viet</span>
          </TabsTrigger>
          <TabsTrigger value="reels" className="flex items-center gap-1.5">
            <Clapperboard className="size-4" />
            <span className="text-xs uppercase tracking-wide">Reels</span>
          </TabsTrigger>
          <TabsTrigger value="collection" className="flex items-center gap-1.5">
            <Package className="size-4" />
            <span className="text-xs uppercase tracking-wide">Bo suu tap</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-2">
          <ProfilePostGrid username={username} />
        </TabsContent>
        <TabsContent value="reels" className="mt-2">
          <ProfileReelGrid username={username} />
        </TabsContent>
        <TabsContent value="collection" className="mt-2">
          <CollectionShowcase username={username} />
        </TabsContent>
      </Tabs>

      {displayProfile.isOwnProfile && (
        <ProfileEditModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          profile={displayProfile}
        />
      )}
    </div>
  );
}
