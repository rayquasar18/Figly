'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Home,
  Compass,
  Clapperboard,
  PlusSquare,
  User,
} from 'lucide-react';
import { useMe } from '@/hooks/queries/auth-queries';
import { useCreatePostStore } from '@/stores/create-post-store';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();
  const { data: user } = useMe();
  const openCreatePost = useCreatePostStore((s) => s.open);
  const profileHref = user?.username ? `/${user.username}` : '/';

  const links = [
    { href: '/', icon: Home, label: 'Trang chu', isActive: pathname === '/' },
    { href: '/explore', icon: Compass, label: 'Kham pha', isActive: pathname === '/explore' },
    { href: '/reels', icon: Clapperboard, label: 'Reels', isActive: pathname.startsWith('/reels') },
    {
      href: profileHref,
      icon: User,
      label: 'Ho so',
      isActive: !!user?.username && pathname.startsWith(`/${user.username}`),
    },
  ];

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-dvh w-[220px] border-r bg-background md:block">
      <div className="flex h-full flex-col px-3 py-6">
        <Link href="/" className="mb-8 px-3 text-xl font-bold">
          Figly
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors',
                link.isActive
                  ? 'font-semibold text-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
              aria-label={link.label}
            >
              <link.icon
                className={cn('size-6', link.isActive && 'fill-current')}
              />
              <span>{link.label}</span>
            </Link>
          ))}
          <button
            type="button"
            onClick={openCreatePost}
            className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Tao bai viet"
          >
            <PlusSquare className="size-6" />
            <span>Tao moi</span>
          </button>
        </nav>
      </div>
    </aside>
  );
}
