import type { Metadata } from 'next';
import { ChecklistsPageClient } from './checklists-page-client';

export const metadata: Metadata = {
  title: 'Checklist cua toi | Figly',
  description: 'Quan ly cac checklist bo suu tap cua ban',
};

export default async function ChecklistsPage() {
  return <ChecklistsPageClient />;
}
