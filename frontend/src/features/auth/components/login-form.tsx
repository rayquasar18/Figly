'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginDto } from '@figly/shared';
import { useLoginMutation } from '@/hooks/queries/auth-queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AxiosError } from 'axios';

export function LoginForm() {
  const router = useRouter();
  const loginMutation = useLoginMutation();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<LoginDto>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(data: LoginDto) {
    setServerError(null);
    try {
      await loginMutation.mutateAsync(data);
      router.push('/');
    } catch (error) {
      if (error instanceof AxiosError) {
        const message = error.response?.data?.message;
        if (typeof message === 'string') {
          setServerError(message);
        } else {
          setServerError('Dang nhap that bai. Vui long thu lai.');
        }
      } else {
        setServerError('Dang nhap that bai. Vui long thu lai.');
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
                  placeholder="Nhap mat khau"
                  autoComplete="current-password"
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
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? 'Dang dang nhap...' : 'Dang nhap'}
        </Button>
      </form>
    </Form>
  );
}
