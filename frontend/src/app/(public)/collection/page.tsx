import type { Metadata } from 'next';
import CollectionPageClient from './collection-page-client';

export const metadata: Metadata = {
  title: 'Bo suu tap | Figly',
  description: 'Duyet qua cac danh muc bo suu tap tren Figly',
};

export default async function CollectionPage() {
  return <CollectionPageClient />;
}
