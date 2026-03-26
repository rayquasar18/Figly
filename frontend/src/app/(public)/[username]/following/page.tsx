import type { Metadata } from 'next';
import FollowingPageClient from './following-page-client';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `Dang theo doi cua ${username} | Figly`,
    description: `Xem danh sach nguoi ma ${username} dang theo doi`,
  };
}

export default async function FollowingPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return <FollowingPageClient username={username} />;
}
