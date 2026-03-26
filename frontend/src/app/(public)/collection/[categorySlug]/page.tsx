import type { Metadata } from 'next';
import CategorySeriesPageClient from './category-series-page-client';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categorySlug: string }>;
}): Promise<Metadata> {
  const { categorySlug } = await params;
  const name = categorySlug.replace(/-/g, ' ');
  return {
    title: `${name} | Figly`,
    description: `Duyet cac series trong danh muc ${name}`,
  };
}

export default async function CategorySeriesPage({
  params,
}: {
  params: Promise<{ categorySlug: string }>;
}) {
  const { categorySlug } = await params;
  return <CategorySeriesPageClient categorySlug={categorySlug} />;
}
