import type { Metadata } from 'next';
import { fetchApi } from '@/lib/server-fetch';
import SeriesItemsPageClient from './series-items-page-client';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://figly.app';
const toAbsoluteUrl = (url: string | null | undefined): string | undefined =>
  url ? (url.startsWith('http') ? url : `${APP_URL}${url}`) : undefined;

interface SeriesResponse {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categorySlug: string; seriesSlug: string }>;
}): Promise<Metadata> {
  const { categorySlug, seriesSlug } = await params;
  const series = await fetchApi<SeriesResponse>(
    `/collection/categories/${categorySlug}/series/${seriesSlug}`,
  );
  if (!series) {
    return { title: 'Bo khong ton tai | Figly' };
  }
  const ogImage = toAbsoluteUrl(series.imageUrl);
  return {
    title: `${series.name} | Figly`,
    description:
      series.description || `Kham pha ${series.name} tren Figly`,
    openGraph: {
      title: `${series.name} | Figly`,
      description:
        series.description || `Kham pha ${series.name} tren Figly`,
      images: ogImage ? [{ url: ogImage }] : [],
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      title: `${series.name} | Figly`,
      images: ogImage ? [ogImage] : [],
    },
  };
}

export default async function SeriesItemsPage({
  params,
}: {
  params: Promise<{ categorySlug: string; seriesSlug: string }>;
}) {
  const { categorySlug, seriesSlug } = await params;

  return (
    <SeriesItemsPageClient
      categorySlug={categorySlug}
      seriesSlug={seriesSlug}
    />
  );
}
