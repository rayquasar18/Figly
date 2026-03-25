import type { Metadata } from 'next';
import { fetchApi } from '@/lib/server-fetch';
import { ChecklistDetailPageClient } from './checklist-detail-page-client';

export const metadata: Metadata = {
  title: 'Chi tiet checklist | Figly',
  description: 'Xem va quan ly checklist bo suu tap cua ban',
};

export default async function ChecklistDetailPage({
  params,
}: {
  params: Promise<{ checklistId: string }>;
}) {
  const { checklistId } = await params;

  // Pre-fetch checklist data server-side
  await fetchApi(`/checklists/${checklistId}`);

  return <ChecklistDetailPageClient checklistId={checklistId} />;
}
