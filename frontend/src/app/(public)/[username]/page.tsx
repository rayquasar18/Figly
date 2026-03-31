import type { Metadata } from 'next';
import { fetchApi } from '@/lib/server-fetch';
import ProfilePageClient from './profile-page-client';

interface ProfileResponse {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
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
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  try {
    const profile = await fetchApi<ProfileResponse>(`/profiles/${username}`);
    if (!profile) return { title: `${username} | Figly` };
    return {
      title: `${profile.displayName || profile.username} (@${profile.username}) | Figly`,
      description: profile.bio || `Xem ho so cua ${profile.username} tren Figly`,
      openGraph: {
        title: `${profile.displayName || profile.username} | Figly`,
        description: profile.bio || `Xem ho so cua ${profile.username} tren Figly`,
        images: profile.avatarUrl ? [{ url: toAbsoluteUrl(profile.avatarUrl)! }] : [],
      },
    };
  } catch {
    return { title: `${username} | Figly` };
  }
}

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return <ProfilePageClient username={username} />;
}
