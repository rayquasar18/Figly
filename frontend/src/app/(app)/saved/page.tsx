import type { Metadata } from 'next';
import { fetchApi } from '@/lib/server-fetch';
import { SavedPageClient } from './saved-page-client';

export const metadata: Metadata = {
  title: 'Da luu | Figly',
  description: 'Xem cac bai viet ban da luu tren Figly',
};

export default async function SavedPostsPage() {
  // Pre-fetch initial saved posts server-side
  await fetchApi('/posts/saved?limit=20');

  return <SavedPageClient />;
}
