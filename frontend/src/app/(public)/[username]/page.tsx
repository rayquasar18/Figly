'use client';

import { use, useState } from 'react';
import { useProfile } from '@/hooks/queries/profile-queries';
import { ProfileHeader } from '@/components/profile/profile-header';
import { ProfilePostGrid } from '@/components/profile/profile-post-grid';
import { ProfileSkeleton } from '@/components/profile/profile-skeleton';
import { ProfileEditModal } from '@/components/profile/profile-edit-modal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Grid3X3, Package } from 'lucide-react';
import { CollectionShowcase } from '@/components/collection/collection-showcase';

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const { data: profile, isLoading, isError } = useProfile(username);
  const [editModalOpen, setEditModalOpen] = useState(false);

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (isError || !profile) {
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
      <ProfileHeader profile={profile} onEditClick={() => setEditModalOpen(true)} />

      <Tabs defaultValue="posts" className="mt-6">
        <TabsList className="w-full justify-center">
          <TabsTrigger value="posts" className="flex items-center gap-1.5">
            <Grid3X3 className="size-4" />
            <span className="text-xs uppercase tracking-wide">Bai viet</span>
          </TabsTrigger>
          <TabsTrigger value="collection" className="flex items-center gap-1.5">
            <Package className="size-4" />
            <span className="text-xs uppercase tracking-wide">Bo suu tap</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-2">
          <ProfilePostGrid username={username} />
        </TabsContent>
        <TabsContent value="collection" className="mt-2">
          <CollectionShowcase username={username} />
        </TabsContent>
      </Tabs>

      {profile.isOwnProfile && (
        <ProfileEditModal open={editModalOpen} onOpenChange={setEditModalOpen} profile={profile} />
      )}
    </div>
  );
}
