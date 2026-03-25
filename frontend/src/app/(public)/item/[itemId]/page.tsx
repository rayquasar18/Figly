import type { Metadata } from 'next';
import { fetchApi } from '@/lib/server-fetch';
import ItemDetailPageClient from './item-detail-page-client';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://figly.app';
const toAbsoluteUrl = (url: string | null | undefined): string | undefined =>
  url ? (url.startsWith('http') ? url : `${APP_URL}${url}`) : undefined;

interface ItemResponse {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ itemId: string }>;
}): Promise<Metadata> {
  const { itemId } = await params;
  const item = await fetchApi<ItemResponse>(`/collection/items/${itemId}`);
  if (!item) {
    return { title: 'Vat pham khong ton tai | Figly' };
  }
  const ogImage = toAbsoluteUrl(item.imageUrl);
  return {
    title: `${item.name} | Figly`,
    description: item.description || `Xem chi tiet ${item.name} tren Figly`,
    openGraph: {
      title: `${item.name} | Figly`,
      description: item.description || `Xem chi tiet ${item.name} tren Figly`,
      images: ogImage ? [{ url: ogImage }] : [],
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      title: `${item.name} | Figly`,
      images: ogImage ? [ogImage] : [],
    },
  };
}

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ itemId: string }>;
}) {
  const { itemId } = await params;

  return <ItemDetailPageClient itemId={itemId} />;
}
