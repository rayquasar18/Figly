'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMe } from '@/hooks/queries/auth-queries';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: user, isLoading } = useMe();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/');
    }
  }, [user, isLoading, router]);

  // Show nothing while checking auth (prevents flash of auth page)
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // If user is authenticated, don't render auth pages (redirect happens above)
  if (user) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
