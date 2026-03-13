'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usernameSchema, USERNAME_RULES } from '@figly/shared';
import { useUpdateProfile, useCheckUsername } from '@/hooks/queries/profile-queries';
import { useAuthStore } from '@/stores/auth-store';
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
import { toast } from 'sonner';
import { Check, X, Loader2 } from 'lucide-react';

const completeProfileSchema = z.object({
  username: usernameSchema,
  displayName: z
    .string()
    .min(1, { message: 'Ten hien thi khong duoc de trong' })
    .max(50, { message: 'Ten hien thi khong duoc vuot qua 50 ky tu' })
    .optional(),
});

type CompleteProfileForm = z.infer<typeof completeProfileSchema>;

export function CompleteProfileForm() {
  const router = useRouter();
  const updateProfile = useUpdateProfile();
  const { user } = useAuthStore();
  const [debouncedUsername, setDebouncedUsername] = useState('');

  const form = useForm<CompleteProfileForm>({
    resolver: zodResolver(completeProfileSchema),
    defaultValues: {
      username: '',
      displayName: user?.name ?? '',
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

  async function onSubmit(data: CompleteProfileForm) {
    try {
      await updateProfile.mutateAsync({
        username: data.username,
        displayName: data.displayName || undefined,
      });
      toast.success('Ho so da duoc cap nhat');
      router.replace('/');
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? 'Cap nhat that bai. Vui long thu lai.';
      toast.error(message);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ten hien thi</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ten hien thi cua ban"
                  autoComplete="name"
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
          disabled={updateProfile.isPending}
        >
          {updateProfile.isPending ? (
            <>
              <Loader2 className="mr-1.5 size-4 animate-spin" />
              Dang luu...
            </>
          ) : (
            'Tiep tuc'
          )}
        </Button>
      </form>
    </Form>
  );
}
