'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams, useRouter } from 'next/navigation';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useResetPasswordMutation } from '@/features/auth';
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
import { toast } from 'sonner';
import { AxiosError } from 'axios';

const resetFormSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, { message: 'Mat khau phai co it nhat 8 ky tu' })
      .regex(/[a-zA-Z]/, { message: 'Mat khau phai chua chu cai' })
      .regex(/[0-9]/, { message: 'Mat khau phai chua so' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Mat khau xac nhan khong khop',
    path: ['confirmPassword'],
  });

type ResetFormData = z.infer<typeof resetFormSchema>;

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const resetMutation = useResetPasswordMutation();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<ResetFormData>({
    resolver: zodResolver(resetFormSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(data: ResetFormData) {
    if (!token) return;
    setServerError(null);

    try {
      await resetMutation.mutateAsync({
        token,
        newPassword: data.newPassword,
      });
      toast.success('Mat khau da duoc dat lai thanh cong!');
      router.push('/login');
    } catch (error) {
      if (error instanceof AxiosError) {
        const message = error.response?.data?.message;
        if (typeof message === 'string') {
          setServerError(message);
        } else {
          setServerError('Dat lai mat khau that bai. Vui long thu lai.');
        }
      } else {
        setServerError('Dat lai mat khau that bai. Vui long thu lai.');
      }
    }
  }

  if (!token) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Lien ket khong hop le</CardTitle>
          <CardDescription>
            Lien ket dat lai mat khau khong hop le hoac da het han.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Link href="/forgot-password">
            <Button variant="outline" className="w-full">
              Gui lai lien ket
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Dat lai mat khau</CardTitle>
        <CardDescription>Nhap mat khau moi cua ban.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {serverError && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {serverError}
              </div>
            )}

            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mat khau moi</FormLabel>
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

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Xac nhan mat khau</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Nhap lai mat khau"
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
              disabled={resetMutation.isPending}
            >
              {resetMutation.isPending
                ? 'Dang dat lai...'
                : 'Dat lai mat khau'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
