import type { Metadata } from 'next';
import { CompleteProfilePageClient } from './complete-profile-page-client';

export const metadata: Metadata = {
  title: 'Hoan thanh ho so | Figly',
  description: 'Chon ten nguoi dung de hoan thanh ho so Figly cua ban',
};

export default async function CompleteProfilePage() {
  return <CompleteProfilePageClient />;
}
