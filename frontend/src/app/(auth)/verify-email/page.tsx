import type { Metadata } from 'next';
import { VerifyEmailPageClient } from './verify-email-page-client';

export const metadata: Metadata = {
  title: 'Xac minh email | Figly',
  description: 'Xac minh dia chi email cua ban de kich hoat tai khoan Figly',
};

export default async function VerifyEmailPage() {
  return <VerifyEmailPageClient />;
}
