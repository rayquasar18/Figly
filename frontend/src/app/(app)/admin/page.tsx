'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { ReportQueue } from '@/components/admin/report-queue';

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.replace('/');
    }
  }, [user, router]);

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
        <ShieldAlert className="size-12" />
        <p>Khong co quyen truy cap</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <h1 className="mb-6 text-xl font-bold">Quan ly bao cao</h1>
      <ReportQueue />
    </div>
  );
}
