'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signupSchema, type SignupDto, USERNAME_RULES } from '@figly/shared';
import { useSignupMutation } from '../hooks/auth-queries';
import { useCheckUsername } from '@/features/profile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { useRouter } from 'next/navigation';
import { AxiosError } from 'axios';
import { Check, X, Loader2 } from 'lucide-react';

export function SignupForm() {
  const router = useRouter();
  const signupMutation = useSignupMutation();
  const [serverError, setServerError] = useState<string | null>(null);
  const [debouncedUsername, setDebouncedUsername] = useState('');

  const form = useForm<SignupDto>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      name: '',
      username: '',
    },
  });

  const watchedUsername = form.watch('username');

  // Debounce username for availability check
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUsername(watchedUsername ?? '');
    }, 300);
    return () => clearTimeout(timer);
  }, [watchedUsername]);

  const shouldCheck = debouncedUsername.length >= USERNAME_RULES.minLength;
  const { data: usernameCheck, isFetching: isCheckingUsername } =
    useCheckUsername(shouldCheck ? debouncedUsername : '');

  async function onSubmit(data: SignupDto) {
    setServerError(null);
    try {
      await signupMutation.mutateAsync(data);
      router.push('/verify-email');
    } catch (error) {
      if (error instanceof AxiosError) {
        const message = error.response?.data?.message;
        if (typeof message === 'string') {
          setServerError(message);
        } else {
          setServerError('Dang ky that bai. Vui long thu lai.');
        }
      } else {
        setServerError('Dang ky that bai. Vui long thu lai.');
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {serverError && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {serverError}
          </div>
        )}

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ten</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="Nhap ten cua ban"
                  autoComplete="name"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ten nguoi dung</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    @
                  </span>
                  <Input
                    className="pl-7"
                    placeholder="username"
                    autoComplete="username"
                    {...field}
                  />
                  {/* Availability indicator */}
                  {shouldCheck && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2">
                      {isCheckingUsername ? (
                        <Loader2 className="size-4 animate-spin text-muted-foreground" />
                      ) : usernameCheck?.available ? (
                        <Check className="size-4 text-green-600" />
                      ) : (
                        <X className="size-4 text-red-500" />
                      )}
                    </span>
                  )}
                </div>
              </FormControl>
              <FormDescription>
                Chi chua chu thuong, so, dau gach duoi va dau cham
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="email@example.com"
                  autoComplete="email"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mat khau</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="It nhat 8 ky tu, co chu va so"
                  autoComplete="new-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={signupMutation.isPending}
        >
          {signupMutation.isPending ? 'Dang dang ky...' : 'Dang ky'}
        </Button>
      </form>
    </Form>
  );
}
