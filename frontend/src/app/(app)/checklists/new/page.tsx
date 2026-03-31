import type { Metadata } from 'next';
import { NewChecklistPageClient } from './new-checklist-page-client';

export const metadata: Metadata = {
  title: 'Tao checklist moi | Figly',
  description: 'Tao checklist moi cho bo suu tap cua ban',
};

export default async function CreateChecklistPage() {
  return <NewChecklistPageClient />;
}
