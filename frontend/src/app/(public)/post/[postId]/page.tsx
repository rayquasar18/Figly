import type { Metadata } from 'next';
import { fetchApi } from '@/lib/server-fetch';
import type { PostResponse } from '@figly/shared';
import PostDetailPageClient from './post-detail-page-client';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://figly.app';
const toAbsoluteUrl = (url: string | null | undefined): string | undefined =>
  url ? (url.startsWith('http') ? url : `${APP_URL}${url}`) : undefined;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ postId: string }>;
}): Promise<Metadata> {
  const { postId } = await params;
  const post = await fetchApi<PostResponse>(`/posts/${postId}`);
  if (!post) {
    return { title: 'Bai viet khong ton tai | Figly' };
  }
  const firstImage = toAbsoluteUrl(post.media?.[0]?.url);
  return {
    title: `${post.author?.displayName || post.author?.username || 'User'} tren Figly`,
    description: post.caption || 'Xem bai viet tren Figly',
    openGraph: {
      title: `${post.author?.displayName || 'User'} tren Figly`,
      description: post.caption || 'Xem bai viet tren Figly',
      images: firstImage ? [{ url: firstImage }] : [],
      type: 'article',
    },
    twitter: {
      card: firstImage ? 'summary_large_image' : 'summary',
      title: `${post.author?.displayName || 'User'} tren Figly`,
      description: post.caption || 'Xem bai viet tren Figly',
      images: firstImage ? [firstImage] : [],
    },
  };
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  const post = await fetchApi<PostResponse>(`/posts/${postId}`);

  return <PostDetailPageClient postId={postId} initialPost={post} />;
}
