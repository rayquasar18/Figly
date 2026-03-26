import type { Metadata } from 'next';
import { ForgotPasswordPageClient } from './forgot-password-page-client';

export const metadata: Metadata = {
  title: 'Quen mat khau | Figly',
  description: 'Dat lai mat khau tai khoan Figly cua ban',
};

export default async function ForgotPasswordPage() {
  return <ForgotPasswordPageClient />;
}
