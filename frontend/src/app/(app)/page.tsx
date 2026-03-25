import type { Metadata } from 'next';
import { fetchApi } from '@/lib/server-fetch';
import { FeedPageClient } from './feed-page-client';

export const metadata: Metadata = {
  title: 'Trang chu | Figly',
  description: 'Xem bai viet moi nhat tu nhung nguoi ban theo doi tren Figly',
};

export default async function FeedPage() {
  // Pre-fetch initial feed data server-side for faster perceived load
  // FeedList inside FeedPageClient uses React Query which will use this as initialData
  // If user has no valid access_token, fetchApi returns null gracefully
  await fetchApi('/feed?limit=20');

  return <FeedPageClient />;
}
