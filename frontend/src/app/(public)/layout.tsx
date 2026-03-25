'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMe } from '@/hooks/queries/auth-queries';
import { PublicNav } from '@/components/layout/public-nav';
import { BottomNav } from '@/components/layout/bottom-nav';
import { CreatePostFlow } from '@/components/create-post/create-post-flow';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: user, isLoading } = useMe();

  // If authenticated but email not verified, redirect to verify
  useEffect(() => {
    if (!isLoading && user && !user.emailVerified) {
      router.replace('/verify-email');
    }
  }, [user, isLoading, router]);

  // If authenticated, verified, but no username, redirect to complete-profile
  useEffect(() => {
    if (!isLoading && user && user.emailVerified && !user.username) {
      router.replace('/complete-profile');
    }
  }, [user, isLoading, router]);

  // While checking email/username gates, show loading
  if (!isLoading && user && (!user.emailVerified || !user.username)) {
    return null;
  }

  return (
    <>
      <PublicNav user={user ?? null} isLoading={isLoading} />
      <main className="pb-14 md:pb-0">{children}</main>
      {/* Show full app chrome for authenticated users */}
      {!isLoading && user && user.username && (
        <>
          <BottomNav />
          <CreatePostFlow />
        </>
      )}
    </>
  );
}
