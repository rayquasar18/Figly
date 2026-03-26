import type { Metadata } from 'next';
import { fetchApi } from '@/lib/server-fetch';
import PostDetailPageClient from './post-detail-page-client';

interface PostResponse {
  id: string;
  caption: string | null;
  author: { username: string; displayName: string | null; avatarUrl: string | null };
  media: { url: string; type: string }[];
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
  params: Promise<{ postId: string }>;
}): Promise<Metadata> {
  const { postId } = await params;
  try {
    const post = await fetchApi<PostResponse>(`/posts/${postId}`);
    if (!post) return { title: 'Bai viet | Figly' };
    const description = post.caption?.slice(0, 160) || `Bai viet cua ${post.author.username}`;
    const imageUrl = post.media?.[0]?.url;
    return {
      title: `${post.author.displayName || post.author.username} tren Figly`,
      description,
      openGraph: {
        title: `Bai viet cua ${post.author.username} | Figly`,
        description,
        images: imageUrl ? [{ url: toAbsoluteUrl(imageUrl)! }] : [],
      },
    };
  } catch {
    return { title: 'Bai viet | Figly' };
  }
}

export default async function PostDetailPage({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  return <PostDetailPageClient postId={postId} />;
}
