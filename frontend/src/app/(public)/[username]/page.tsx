import type { Metadata } from 'next';
import { fetchApi } from '@/lib/server-fetch';
import type { ProfileResponse } from '@figly/shared';
import ProfilePageClient from './profile-page-client';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://figly.app';
const toAbsoluteUrl = (url: string | null | undefined): string | undefined =>
  url ? (url.startsWith('http') ? url : `${APP_URL}${url}`) : undefined;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const profile = await fetchApi<ProfileResponse>(`/profiles/${username}`);
  if (!profile) {
    return { title: 'Nguoi dung khong ton tai | Figly' };
  }
  const ogImage = toAbsoluteUrl(profile.avatarUrl);
  return {
    title: `${profile.displayName || profile.username} (@${profile.username}) | Figly`,
    description:
      profile.bio ||
      `Xem bo suu tap cua ${profile.displayName || profile.username} tren Figly`,
    openGraph: {
      title: `${profile.displayName || profile.username} (@${profile.username})`,
      description:
        profile.bio ||
        `Xem bo suu tap cua ${profile.displayName || profile.username} tren Figly`,
      images: ogImage ? [{ url: ogImage }] : [],
      type: 'profile',
    },
    twitter: {
      card: 'summary',
      title: `${profile.displayName || profile.username} (@${profile.username})`,
      description:
        profile.bio ||
        `Xem bo suu tap cua ${profile.displayName || profile.username} tren Figly`,
      images: ogImage ? [ogImage] : [],
    },
  };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const profile = await fetchApi<ProfileResponse>(`/profiles/${username}`);

  return <ProfilePageClient username={username} initialProfile={profile} />;
}
