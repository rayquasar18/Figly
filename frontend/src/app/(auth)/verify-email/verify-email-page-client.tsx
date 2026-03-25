'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useVerifyEmailMutation } from '@/features/auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function VerifyEmailPageClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const verifyMutation = useVerifyEmailMutation();
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (token && !verified && !verifyMutation.isPending) {
      verifyMutation.mutate(token, {
        onSuccess: () => setVerified(true),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Token provided - verifying
  if (token) {
    if (verifyMutation.isPending) {
      return (
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Dang xac minh...</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </CardContent>
        </Card>
      );
    }

    if (verified) {
      return (
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Xac minh thanh cong!</CardTitle>
            <CardDescription>
              Email da duoc xac minh! Ban co the dang nhap.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/login">
              <Button className="w-full">Dang nhap</Button>
            </Link>
          </CardContent>
        </Card>
      );
    }

    if (verifyMutation.isError) {
      return (
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Xac minh that bai</CardTitle>
            <CardDescription className="text-destructive">
              Lien ket xac minh khong hop le hoac da het han.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/login">
              <Button variant="outline" className="w-full">
                Quay lai dang nhap
              </Button>
            </Link>
          </CardContent>
        </Card>
      );
    }
  }

  // No token - show "check your email" message
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Xac minh email</CardTitle>
        <CardDescription>
          Vui long kiem tra email de xac minh tai khoan.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-sm text-muted-foreground">
          Chung toi da gui mot lien ket xac minh den email cua ban.
          Vui long nhan vao lien ket de kich hoat tai khoan.
        </p>
        <Link href="/login">
          <Button variant="outline" className="w-full">
            Quay lai dang nhap
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
