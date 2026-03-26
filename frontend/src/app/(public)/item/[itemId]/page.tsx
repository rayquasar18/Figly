import type { Metadata } from 'next';
import { fetchApi } from '@/lib/server-fetch';
import ItemDetailPageClient from './item-detail-page-client';

interface ItemResponse {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  series: { name: string };
}

function toAbsoluteUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('http')) return path;
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
  return `${base.replace('/api', '')}${path}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ itemId: string }>;
}): Promise<Metadata> {
  const { itemId } = await params;
  try {
    const item = await fetchApi<ItemResponse>(`/collection/items/${itemId}`);
    if (!item) return { title: 'Vat pham | Figly' };
    return {
      title: `${item.name} | Figly`,
      description: item.description || `${item.name} - ${item.series.name}`,
      openGraph: {
        title: `${item.name} | Figly`,
        description: item.description || `${item.name} - ${item.series.name}`,
        images: item.imageUrl ? [{ url: toAbsoluteUrl(item.imageUrl)! }] : [],
      },
    };
  } catch {
    return { title: 'Vat pham | Figly' };
  }
}

export default async function ItemDetailPage({ params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await params;
  return <ItemDetailPageClient itemId={itemId} />;
}
