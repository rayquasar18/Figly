import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ResetPasswordPageClient } from './reset-password-page-client';

export const metadata: Metadata = {
  title: 'Dat lai mat khau | Figly',
  description: 'Nhap mat khau moi cho tai khoan Figly cua ban',
};

export default async function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordPageClient />
    </Suspense>
  );
}
