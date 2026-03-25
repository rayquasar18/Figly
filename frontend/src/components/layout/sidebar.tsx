'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Compass, Clapperboard, PlusSquare, User, Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useMe } from '@/features/auth';
import { useCreatePostStore } from '@/features/create-post';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

export function Sidebar() {
  const pathname = usePathname();
  const { data: user } = useMe();
  const openCreatePost = useCreatePostStore((s) => s.open);
  const profileHref = user?.username ? `/${user.username}` : '/';
  const { theme, setTheme } = useTheme();

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
              <link.icon className={cn('size-6', link.isActive && 'fill-current')} />
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

        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                <Avatar className="size-6">
                  <AvatarFallback>
                    {(user.name || user.username || 'U')[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">{user.name || user.username}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-56">
              <DropdownMenuLabel>Giao dien</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setTheme('light')}>
                <Sun className="mr-2 size-4" />
                Sang
                {theme === 'light' && <span className="ml-auto text-xs">&#10003;</span>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>
                <Moon className="mr-2 size-4" />
                Toi
                {theme === 'dark' && <span className="ml-auto text-xs">&#10003;</span>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')}>
                <Monitor className="mr-2 size-4" />
                He thong
                {theme === 'system' && <span className="ml-auto text-xs">&#10003;</span>}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </aside>
  );
}
