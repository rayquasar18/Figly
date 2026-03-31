import type { Metadata } from 'next';
import { ChecklistDetailPageClient } from './checklist-detail-page-client';

export const metadata: Metadata = {
  title: 'Chi tiet checklist | Figly',
  description: 'Xem va quan ly chi tiet checklist cua ban',
};

export default async function ChecklistDetailPage({
  params,
}: {
  params: Promise<{ checklistId: string }>;
}) {
  const { checklistId } = await params;
  return <ChecklistDetailPageClient checklistId={checklistId} />;
}
