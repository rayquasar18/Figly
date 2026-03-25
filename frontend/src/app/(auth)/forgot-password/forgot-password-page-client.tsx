'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordRequestSchema, type ResetPasswordRequestDto } from '@figly/shared';
import { useForgotPasswordMutation } from '@/features/auth';
import Link from 'next/link';
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function ForgotPasswordPageClient() {
  const forgotPasswordMutation = useForgotPasswordMutation();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<ResetPasswordRequestDto>({
    resolver: zodResolver(resetPasswordRequestSchema),
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit(data: ResetPasswordRequestDto) {
    await forgotPasswordMutation.mutateAsync(data);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Kiem tra email</CardTitle>
          <CardDescription>
            Neu email ton tai, ban se nhan duoc lien ket dat lai mat khau.
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

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Quen mat khau</CardTitle>
        <CardDescription>
          Nhap email cua ban de nhan lien ket dat lai mat khau.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

            <Button
              type="submit"
              className="w-full"
              disabled={forgotPasswordMutation.isPending}
            >
              {forgotPasswordMutation.isPending
                ? 'Dang gui...'
                : 'Gui lien ket dat lai'}
            </Button>
          </form>
        </Form>

        <div className="mt-4 text-center">
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:text-primary hover:underline"
          >
            Quay lai dang nhap
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
