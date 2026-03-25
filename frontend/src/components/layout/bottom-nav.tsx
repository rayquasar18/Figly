'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Clapperboard, Package, PlusSquare, User } from 'lucide-react';
import { useMe } from '@/features/auth';
import { useCreatePostStore } from '@/features/create-post';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const pathname = usePathname();
  const { data: user } = useMe();
  const openCreatePost = useCreatePostStore((s) => s.open);

  const profileHref = user?.username ? `/${user.username}` : '/';

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background md:hidden">
      <div className="flex h-14 items-center justify-around">
        <NavLink
          href="/"
          icon={Home}
          label="Trang chu"
          isActive={pathname === '/'}
        />
        <NavLink
          href="/reels"
          icon={Clapperboard}
          label="Reels"
          isActive={pathname.startsWith('/reels')}
        />
        <NavLink
          href="/collection"
          icon={Package}
          label="Suu tap"
          isActive={pathname.startsWith('/collection')}
        />
        <button
          type="button"
          onClick={openCreatePost}
          className="flex flex-col items-center justify-center gap-0.5 p-2"
          aria-label="Tao bai viet"
        >
          <PlusSquare className="size-6 stroke-[2.5]" />
        </button>
        <NavLink
          href={profileHref}
          icon={User}
          label="Ho so"
          isActive={
            !!user?.username && pathname.startsWith(`/${user.username}`)
          }
        />
      </div>
    </nav>
  );
}

function NavLink({
  href,
  icon: Icon,
  label,
  isActive,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex flex-col items-center justify-center gap-0.5 p-2',
        isActive ? 'text-foreground' : 'text-muted-foreground',
      )}
      aria-label={label}
    >
      <Icon className={cn('size-6', isActive && 'fill-current')} />
    </Link>
  );
}
