import type { Metadata } from 'next';
import ExplorePageClient from './explore-page-client';

export const metadata: Metadata = {
  title: 'Kham pha | Figly',
  description: 'Kham pha bo suu tap va bai viet moi tren Figly',
  openGraph: {
    title: 'Kham pha | Figly',
    description: 'Kham pha bo suu tap va bai viet moi tren Figly',
  },
};

export default async function ExplorePage() {
  return <ExplorePageClient />;
}
