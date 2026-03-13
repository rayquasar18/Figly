'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useLogoutMutation } from '@/hooks/queries/auth-queries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const logoutMutation = useLogoutMutation();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    router.push('/login');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            Chao mung, {user?.name}!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">
            Ban da dang nhap thanh cong vao Figly.
          </p>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
          >
            {logoutMutation.isPending ? 'Dang dang xuat...' : 'Dang xuat'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
