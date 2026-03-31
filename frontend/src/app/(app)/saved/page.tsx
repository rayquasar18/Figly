import type { Metadata } from 'next';
import { SavedPageClient } from './saved-page-client';

export const metadata: Metadata = {
  title: 'Da luu | Figly',
  description: 'Xem cac bai viet da luu cua ban',
};

export default async function SavedPostsPage() {
  return <SavedPageClient />;
}
