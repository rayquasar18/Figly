'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { SearchInput } from '@/components/search/search-input';
import { UserResultCard } from '@/components/search/user-result-card';
import { HashtagResultCard } from '@/components/search/hashtag-result-card';
import { ItemResultCard } from '@/components/search/item-result-card';
import {
  useSearchUsers,
  useSearchHashtags,
  useSearchItemsGlobal,
} from '@/hooks/queries/search-queries';
import { cn } from '@/lib/utils';

type SearchTab = 'users' | 'hashtags' | 'items';

const TABS: { key: SearchTab; label: string }[] = [
  { key: 'users', label: 'Nguoi dung' },
  { key: 'hashtags', label: 'Hashtag' },
  { key: 'items', label: 'Vat pham' },
];

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchTab>('users');

  // 300ms debounce
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="mx-auto max-w-[470px] pb-16">
      {/* Search input */}
      <div className="px-4 pt-4 pb-2">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Tim kiem nguoi dung, hashtag, vat pham..."
          autoFocus
        />
      </div>

      {/* Tab bar */}
      <div className="flex border-b px-4">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex-1 py-2.5 text-sm font-medium text-center transition-colors',
              activeTab === tab.key
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Results */}
      {!debouncedQuery ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <p className="text-muted-foreground text-sm">
            Tim kiem nguoi dung, hashtag, hoac vat pham
          </p>
        </div>
      ) : (
        <>
          {activeTab === 'users' && (
            <UsersTab query={debouncedQuery} />
          )}
          {activeTab === 'hashtags' && (
            <HashtagsTab query={debouncedQuery} />
          )}
          {activeTab === 'items' && (
            <ItemsTab query={debouncedQuery} />
          )}
        </>
      )}
    </div>
  );
}

function UsersTab({ query }: { query: string }) {
  const { data, isLoading } = useSearchUsers(query);

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <p className="text-sm text-muted-foreground">
          Khong tim thay ket qua
        </p>
      </div>
    );
  }

  return (
    <div>
      {data.map((user) => (
        <UserResultCard key={user.id} user={user} />
      ))}
    </div>
  );
}

function HashtagsTab({ query }: { query: string }) {
  const { data, isLoading } = useSearchHashtags(query);

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <p className="text-sm text-muted-foreground">
          Khong tim thay ket qua
        </p>
      </div>
    );
  }

  return (
    <div>
      {data.map((hashtag) => (
        <HashtagResultCard key={hashtag.id} hashtag={hashtag} />
      ))}
    </div>
  );
}

function ItemsTab({ query }: { query: string }) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useSearchItemsGlobal(query);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const items = data?.pages.flatMap((page) => page.items) ?? [];

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <p className="text-sm text-muted-foreground">
          Khong tim thay ket qua
        </p>
      </div>
    );
  }

  return (
    <div>
      {items.map((item) => (
        <ItemResultCard key={item.id} item={item} />
      ))}

      {/* Sentinel for infinite scroll */}
      <div ref={sentinelRef} className="h-px" />

      {isFetchingNextPage && (
        <div className="flex justify-center py-6">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
