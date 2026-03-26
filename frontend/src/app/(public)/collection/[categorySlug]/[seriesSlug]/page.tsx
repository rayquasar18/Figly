import type { Metadata } from 'next';
import SeriesItemsPageClient from './series-items-page-client';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categorySlug: string; seriesSlug: string }>;
}): Promise<Metadata> {
  const { categorySlug, seriesSlug } = await params;
  const seriesName = seriesSlug.replace(/-/g, ' ');
  const categoryName = categorySlug.replace(/-/g, ' ');
  return {
    title: `${seriesName} - ${categoryName} | Figly`,
    description: `Duyet cac vat pham trong ${seriesName}`,
  };
}

export default async function SeriesItemsPage({
  params,
}: {
  params: Promise<{ categorySlug: string; seriesSlug: string }>;
}) {
  const { categorySlug, seriesSlug } = await params;
  return <SeriesItemsPageClient categorySlug={categorySlug} seriesSlug={seriesSlug} />;
}
