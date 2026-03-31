import type { Metadata } from 'next';
import { CompleteProfilePageClient } from './complete-profile-page-client';

export const metadata: Metadata = {
  title: 'Hoan thanh ho so | Figly',
  description: 'Thiet lap ten nguoi dung de bat dau su dung Figly',
};

export default async function CompleteProfilePage() {
  return <CompleteProfilePageClient />;
}
