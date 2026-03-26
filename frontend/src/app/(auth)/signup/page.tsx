import type { Metadata } from 'next';
import Link from 'next/link';
import { SignupForm } from '@/features/auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Dang ky | Figly',
  description: 'Tao tai khoan Figly moi',
};

export default function SignupPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Dang ky</CardTitle>
        <CardDescription>Tao tai khoan Figly moi</CardDescription>
      </CardHeader>
      <CardContent>
        <SignupForm />
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Da co tai khoan?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Dang nhap
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
