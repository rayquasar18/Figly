import Link from 'next/link';
import { LoginForm } from '@/components/auth/login-form';
import { SocialLoginButtons } from '@/components/auth/social-login-buttons';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function LoginPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Dang nhap</CardTitle>
        <CardDescription>Dang nhap vao tai khoan Figly cua ban</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <LoginForm />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">hoac</span>
          </div>
        </div>

        <SocialLoginButtons />
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <Link
          href="/forgot-password"
          className="text-sm text-muted-foreground hover:text-primary hover:underline"
        >
          Quen mat khau?
        </Link>
        <p className="text-sm text-muted-foreground">
          Chua co tai khoan?{' '}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Dang ky
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
