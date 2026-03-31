import type { Metadata } from 'next';
import { fetchApi } from '@/lib/server-fetch';
import { ReelsPageClient } from './reels-page-client';

export const metadata: Metadata = {
  title: 'Reels | Figly',
  description: 'Xem video ngan tu cong dong Figly',
};

export default async function ReelsPage() {
  const initialReels = await fetchApi('/feed/reels?limit=10');
  return <ReelsPageClient />;
}
