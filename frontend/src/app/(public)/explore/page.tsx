import type { Metadata } from 'next';
import ExplorePageClient from './explore-page-client';

export const metadata: Metadata = {
  title: 'Kham pha | Figly',
  description: 'Kham pha bai viet moi tu cong dong Figly',
};

export default async function ExplorePage() {
  return <ExplorePageClient />;
}
