import type { Metadata } from 'next';
import { Suspense } from 'react';
import { VerifyEmailPageClient } from './verify-email-page-client';

export const metadata: Metadata = {
  title: 'Xac thuc email | Figly',
};

export default async function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailPageClient />
    </Suspense>
  );
}
