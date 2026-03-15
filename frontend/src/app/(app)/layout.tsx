'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Settings, Shield, MessageCircle } from 'lucide-react';
import { useMe } from '@/hooks/queries/auth-queries';
import { BottomNav } from '@/components/layout/bottom-nav';
import { CreatePostFlow } from '@/components/create-post/create-post-flow';
import { NotificationBell } from '@/components/notification/notification-bell';
import { useSSE } from '@/hooks/use-sse';
import { useMessagingSocket } from '@/hooks/use-messaging-socket';
import { useUnreadTotal } from '@/hooks/queries/messaging-queries';
import { useMessagingStore } from '@/stores/messaging-store';
import { usePushPermission } from '@/hooks/use-push-permission';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: user, isLoading, isError } = useMe();

  // SSE connection for real-time notifications
  useSSE(!!user);

  // WebSocket connection for real-time messaging (app-wide)
  useMessagingSocket(!!user);

  // Keep unread total synced
  const { data: unreadData } = useUnreadTotal();
  const totalUnread = useMessagingStore((s) => s.totalUnread);

  // Push subscription management
  usePushPermission();

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
      {/* Top header bar - Instagram style */}
      <header className="sticky top-0 z-50 border-b bg-background">
        <div className="mx-auto flex h-12 max-w-lg items-center justify-between px-4">
          <Link href="/" className="text-lg font-bold tracking-tight">
            Figly
          </Link>
          <div className="flex items-center gap-2">
            {user.role === 'ADMIN' && (
              <Link
                href="/admin"
                className="flex size-7 items-center justify-center rounded-full hover:bg-muted"
                aria-label="Quan ly"
              >
                <Shield className="size-4 text-muted-foreground" />
              </Link>
            )}
            <Link
              href="/settings"
              className="flex size-7 items-center justify-center rounded-full hover:bg-muted"
              aria-label="Cai dat"
            >
              <Settings className="size-4 text-muted-foreground" />
            </Link>
            <Link
              href="/messages"
              className="relative flex size-7 items-center justify-center rounded-full hover:bg-muted"
              aria-label="Tin nhan"
            >
              <MessageCircle className="size-4 text-muted-foreground" />
              {totalUnread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                  {totalUnread > 9 ? '9+' : totalUnread}
                </span>
              )}
            </Link>
            <NotificationBell />
            {user.username && (
              <Link
                href={`/${user.username}`}
                className="flex size-7 items-center justify-center overflow-hidden rounded-full bg-muted"
              >
                <span className="text-xs font-medium text-muted-foreground">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="pb-14 md:pb-0">{children}</main>
      <BottomNav />
      <CreatePostFlow />
    </>
  );
}
