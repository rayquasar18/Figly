'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createChecklistSchema, type CreateChecklistDto } from '@figly/shared';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';

interface ChecklistFormProps {
  defaultValues?: { name: string; isPublic: boolean };
  onSubmit: (data: CreateChecklistDto) => void;
  isPending?: boolean;
  submitLabel?: string;
}

export function ChecklistForm({
  defaultValues = { name: '', isPublic: false },
  onSubmit,
  isPending = false,
  submitLabel = 'Tao checklist',
}: ChecklistFormProps) {
  const form = useForm<CreateChecklistDto>({
    resolver: zodResolver(createChecklistSchema),
    defaultValues,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ten checklist</FormLabel>
              <FormControl>
                <Input
                  placeholder="VD: Gundam can mua, Sneakers yeu thich..."
                  maxLength={100}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isPublic"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Cong khai</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Cho phep nguoi khac xem checklist nay
                </p>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? 'Dang xu ly...' : submitLabel}
        </Button>
      </form>
    </Form>
  );
}
