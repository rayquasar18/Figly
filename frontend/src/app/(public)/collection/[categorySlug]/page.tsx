import type { Metadata } from 'next';
import { fetchApi } from '@/lib/server-fetch';
import CategorySeriesPageClient from './category-series-page-client';

interface CategoryResponse {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categorySlug: string }>;
}): Promise<Metadata> {
  const { categorySlug } = await params;
  const category = await fetchApi<CategoryResponse>(
    `/collection/categories/${categorySlug}`,
  );
  if (!category) {
    return { title: 'Danh muc khong ton tai | Figly' };
  }
  return {
    title: `${category.name} | Figly`,
    description:
      category.description || `Kham pha ${category.name} tren Figly`,
    openGraph: {
      title: `${category.name} | Figly`,
      description:
        category.description || `Kham pha ${category.name} tren Figly`,
    },
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
