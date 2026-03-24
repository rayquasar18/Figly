'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  usernameSchema,
  bioSchema,
  USERNAME_RULES,
  PROFILE_LIMITS,
} from '@figly/shared';
import type { ProfileResponse } from '@figly/shared';
import {
  useUpdateProfile,
  useCheckUsername,
} from '@/hooks/queries/profile-queries';
import { apiClient } from '@/lib/api-client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';
import { Check, X, Loader2 } from 'lucide-react';

const editProfileSchema = z.object({
  displayName: z
    .string()
    .min(1, { message: 'Ten hien thi khong duoc de trong' })
    .max(50, { message: 'Ten hien thi khong duoc vuot qua 50 ky tu' }),
  username: usernameSchema,
  bio: bioSchema.or(z.literal('')).transform((val) => val || ''),
  avatarId: z.string().optional(),
});

type EditProfileForm = z.infer<typeof editProfileSchema>;

interface ProfileEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: ProfileResponse;
}

function getInitials(name: string | undefined | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function ProfileEditModal({
  open,
  onOpenChange,
  profile,
}: ProfileEditModalProps) {
  const updateProfile = useUpdateProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [debouncedUsername, setDebouncedUsername] = useState('');

  const form = useForm<EditProfileForm>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      displayName: profile.displayName,
      username: profile.username,
      bio: profile.bio ?? '',
      avatarId: undefined,
    },
  });

  const watchedUsername = form.watch('username');
  const watchedBio = form.watch('bio');

  // Debounce username for availability check
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUsername(watchedUsername ?? '');
    }, 300);
    return () => clearTimeout(timer);
  }, [watchedUsername]);

  // Only check availability if username differs from current
  const shouldCheckUsername =
    debouncedUsername.length >= USERNAME_RULES.minLength &&
    debouncedUsername !== profile.username;

  const { data: usernameCheck, isFetching: isCheckingUsername } =
    useCheckUsername(shouldCheckUsername ? debouncedUsername : '');

  // Reset form when profile changes or modal opens
  useEffect(() => {
    if (open) {
      form.reset({
        displayName: profile.displayName,
        username: profile.username,
        bio: profile.bio ?? '',
        avatarId: undefined,
      });
      setAvatarPreview(null);
    }
  }, [open, profile, form]);

  const handleAvatarUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Preview immediately
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);

      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.post<{ id: string }>(
          '/media/upload',
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } },
        );
        form.setValue('avatarId', response.data.id);
      } catch {
        toast.error('Tai anh len that bai. Vui long thu lai.');
        setAvatarPreview(null);
      } finally {
        setUploading(false);
      }
    },
    [form],
  );

  async function onSubmit(data: EditProfileForm) {
    try {
      await updateProfile.mutateAsync({
        displayName: data.displayName,
        username: data.username,
        bio: data.bio || null,
        avatarId: data.avatarId,
      });
      toast.success('Cap nhat thanh cong');
      onOpenChange(false);
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? 'Cap nhat that bai. Vui long thu lai.';
      toast.error(message);
    }
  }

  const bioLength = (watchedBio ?? '').length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Chinh sua trang ca nhan</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-5"
          >
            {/* Avatar upload */}
            <div className="flex flex-col items-center gap-3">
              <Avatar className="size-20 border">
                <AvatarImage
                  src={avatarPreview ?? profile.avatarUrl ?? undefined}
                  alt={profile.displayName}
                />
                <AvatarFallback className="text-xl font-medium">
                  {getInitials(profile.displayName)}
                </AvatarFallback>
              </Avatar>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
              <Button
                type="button"
                variant="link"
                size="sm"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                    Dang tai len...
                  </>
                ) : (
                  'Doi anh dai dien'
                )}
              </Button>
            </div>

            {/* Display name */}
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

            {/* Username */}
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
                      {shouldCheckUsername && (
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
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Bio */}
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tieu su</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Gioi thieu ban than..."
                      rows={3}
                      maxLength={PROFILE_LIMITS.bioMaxLength}
                      {...field}
                    />
                  </FormControl>
                  <div className="flex justify-between">
                    <FormMessage />
                    <span
                      className={`text-xs tabular-nums ${
                        bioLength > PROFILE_LIMITS.bioMaxLength
                          ? 'text-destructive'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {bioLength}/{PROFILE_LIMITS.bioMaxLength}
                    </span>
                  </div>
                </FormItem>
              )}
            />

            {/* Submit */}
            <Button
              type="submit"
              className="w-full"
              disabled={updateProfile.isPending || uploading}
            >
              {updateProfile.isPending ? (
                <>
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                  Dang luu...
                </>
              ) : (
                'Luu thay doi'
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
