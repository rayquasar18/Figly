import type { Metadata } from 'next';
import { FeedPageClient } from './feed-page-client';

export const metadata: Metadata = {
  title: 'Trang chu | Figly',
  description: 'Xem bai viet moi nhat tu nhung nguoi ban theo doi tren Figly',
};

export default async function FeedPage() {
  return <FeedPageClient />;
}
