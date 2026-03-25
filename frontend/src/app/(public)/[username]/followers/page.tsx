import type { Metadata } from 'next';
import FollowersPageClient from './followers-page-client';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `Nguoi theo doi ${username} | Figly`,
    description: `Danh sach nguoi theo doi ${username}`,
  };
}

export default async function FollowersPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  return <FollowersPageClient username={username} />;
}
