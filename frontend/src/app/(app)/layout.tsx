'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useMe } from '@/features/auth';
import { BottomNav } from '@/components/layout/bottom-nav';
import { CreatePostFlow } from '@/features/create-post';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: user, isLoading, isError } = useMe();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!isLoading && user && !user.emailVerified) {
      router.replace('/verify-email');
    }
  }, [user, isLoading, router]);

  // Username gate: redirect OAuth users without username to complete-profile
  useEffect(() => {
    if (
      !isLoading &&
      user &&
      user.emailVerified &&
      !user.username &&
      pathname !== '/complete-profile'
    ) {
      router.replace('/complete-profile');
    }
  }, [user, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isError || !user) {
    return null;
  }

  if (!user.emailVerified) {
    return null;
  }

  // Allow complete-profile page even without username
  if (!user.username && pathname !== '/complete-profile') {
    return null;
  }

  return (
    <>
      <main className="pb-14 md:pb-0">{children}</main>
      <BottomNav />
      <CreatePostFlow />
    </>
  );
}
