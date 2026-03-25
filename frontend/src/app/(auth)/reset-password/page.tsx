import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ResetPasswordPageClient } from './reset-password-page-client';

export const metadata: Metadata = {
  title: 'Dat lai mat khau | Figly',
};

export default async function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordPageClient />
    </Suspense>
  );
}
