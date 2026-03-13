'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMe } from '@/hooks/queries/auth-queries';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
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

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isError || !user) {
    return null;
  }

  if (!user.emailVerified) {
    return null;
  }

  return <>{children}</>;
}
