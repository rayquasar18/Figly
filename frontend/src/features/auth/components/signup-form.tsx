'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signupSchema, type SignupDto } from '@figly/shared';
import { useSignupMutation } from '../hooks/auth-queries';
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
import { useRouter } from 'next/navigation';
import { AxiosError } from 'axios';

export function SignupForm() {
  const router = useRouter();
  const signupMutation = useSignupMutation();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<SignupDto>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

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

        <Button type="submit" className="w-full" disabled={signupMutation.isPending}>
          {signupMutation.isPending ? 'Dang dang ky...' : 'Dang ky'}
        </Button>
      </form>
    </Form>
  );
}
