'use client';

import { CompleteProfileForm } from '@/components/profile/complete-profile-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function CompleteProfilePageClient() {
  return (
    <div className="flex min-h-[80dvh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-balance text-2xl font-bold">Hoan thanh ho so</CardTitle>
          <CardDescription>Chon ten nguoi dung de bat dau</CardDescription>
        </CardHeader>
        <CardContent>
          <CompleteProfileForm />
        </CardContent>
      </Card>
    </div>
  );
}
