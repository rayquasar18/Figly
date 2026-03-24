'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useMe } from '@/hooks/queries/auth-queries';
import { BottomNav } from '@/components/layout/bottom-nav';
import { Sidebar } from '@/components/layout/sidebar';
import { HeaderSearch } from '@/components/layout/header-search';
import { CreatePostFlow } from '@/components/create-post/create-post-flow';
import { CreateReelFlow } from '@/components/reel/create-reel-flow';

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

  // Hide header on full-screen pages like /reels
  const hideHeader = pathname.startsWith('/reels');

  return (
    <>
      <Sidebar />
      <div className="md:ml-[220px]">
        {!hideHeader && (
          <header className="sticky top-0 z-40 border-b bg-background">
            <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
              <Link href="/" className="text-xl font-bold md:hidden">
                Figly
              </Link>
              <HeaderSearch />
            </div>
          </header>
        )}
        <main className="pb-14 md:pb-0">{children}</main>
      </div>
      <BottomNav />
      <CreatePostFlow />
      <CreateReelFlow />
    </>
  );
}
