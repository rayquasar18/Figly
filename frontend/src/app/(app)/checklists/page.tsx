import type { Metadata } from 'next';
import { fetchApi } from '@/lib/server-fetch';
import { ChecklistsPageClient } from './checklists-page-client';

export const metadata: Metadata = {
  title: 'Checklist cua toi | Figly',
  description: 'Quan ly cac checklist bo suu tap cua ban tren Figly',
};

export default async function ChecklistsPage() {
  // Pre-fetch checklists server-side
  await fetchApi('/checklists');

  return <ChecklistsPageClient />;
}
