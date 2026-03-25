'use client';

import { useState, useRef, useCallback } from 'react';
import { X, Film, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useCreateReelStore } from '../stores/create-reel-store';
import { useCreateReel } from '../hooks/reel-queries';
import { apiClient } from '@/lib/api-client';
import { REEL_LIMITS } from '@figly/shared';
import { ItemPicker } from '@/features/collection';
import type { LinkedItemResponse } from '@figly/shared';

export function CreateReelFlow() {
  const isOpen = useCreateReelStore((s) => s.isOpen);
  const step = useCreateReelStore((s) => s.step);
  const file = useCreateReelStore((s) => s.file);
  const previewUrl = useCreateReelStore((s) => s.previewUrl);
  const duration = useCreateReelStore((s) => s.duration);
  const width = useCreateReelStore((s) => s.width);
  const height = useCreateReelStore((s) => s.height);
  const close = useCreateReelStore((s) => s.close);
  const setFile = useCreateReelStore((s) => s.setFile);
  const setStep = useCreateReelStore((s) => s.setStep);

  const [caption, setCaption] = useState('');
  const [linkedItemIds, setLinkedItemIds] = useState<string[]>([]);
  const [linkedItems, setLinkedItems] = useState<LinkedItemResponse[]>([]);
  const [itemPickerOpen, setItemPickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createReelMutation = useCreateReel();

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (!selected) return;

      // Validate size
      if (selected.size > REEL_LIMITS.maxVideoSize) {
        toast.error('Video khong duoc vuot qua 100MB');
        return;
      }

      // Extract video metadata
      const url = URL.createObjectURL(selected);
      const videoEl = document.createElement('video');
      videoEl.preload = 'metadata';
      videoEl.src = url;

      videoEl.onloadedmetadata = () => {
        // Validate duration
        if (videoEl.duration > REEL_LIMITS.maxDurationSeconds) {
          toast.error('Video khong duoc vuot qua 60 giay');
          URL.revokeObjectURL(url);
          return;
        }

        setFile(selected, url, videoEl.duration, videoEl.videoWidth, videoEl.videoHeight);
      };

      videoEl.onerror = () => {
        toast.error('Khong the doc video. Vui long thu lai.');
        URL.revokeObjectURL(url);
      };

      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [setFile],
  );

  const handlePublish = useCallback(async () => {
    if (!file) return;

    setStep('processing');

    try {
      // 1. Upload video
      const formData = new FormData();
      formData.append('file', file, file.name);
      formData.append('purpose', 'reel');

      const uploadResponse = await apiClient.post<{ id: string }>('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const mediaId = uploadResponse.data.id;

      // 2. Poll media status until COMPLETED
      let attempts = 0;
      const maxAttempts = 60;

      while (attempts < maxAttempts) {
        const statusResponse = await apiClient.get<{ status: string }>(`/media/${mediaId}/status`);

        if (statusResponse.data.status === 'COMPLETED') {
          break;
        }

        if (statusResponse.data.status === 'FAILED') {
          throw new Error('Video processing failed');
        }

        await new Promise((resolve) => setTimeout(resolve, 2000));
        attempts++;
      }

      if (attempts >= maxAttempts) {
        throw new Error('Video processing timed out');
      }

      // 3. Create reel
      await createReelMutation.mutateAsync({
        mediaId,
        caption: caption.trim() || undefined,
        linkedItemIds: linkedItemIds.length > 0 ? linkedItemIds : undefined,
        duration,
        width,
        height,
      });

      toast.success('Reel da duoc dang!');
      setCaption('');
      setLinkedItemIds([]);
      setLinkedItems([]);
      close();
    } catch {
      toast.error('Khong the tai len. Kiem tra ket noi mang va thu lai.');
      setStep('preview');
    }
  }, [file, caption, linkedItemIds, duration, width, height, close, createReelMutation, setStep]);

  const handleClose = useCallback(() => {
    setCaption('');
    setLinkedItemIds([]);
    setLinkedItems([]);
    close();
  }, [close]);

  const handleItemSelect = useCallback((ids: string[], items?: LinkedItemResponse[]) => {
    setLinkedItemIds(ids);
    if (items) setLinkedItems(items);
    setItemPickerOpen(false);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background">
      {/* Step 1: Select video */}
      {step === 'select' && (
        <>
          <header className="flex h-12 shrink-0 items-center justify-between border-b px-4">
            <Button variant="ghost" size="icon" onClick={handleClose} aria-label="Dong">
              <X className="size-5" />
            </Button>
            <h1 className="text-sm font-semibold">Tao reel moi</h1>
            <div className="w-9" />
          </header>
          <div
            className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-4"
            onClick={() => fileInputRef.current?.click()}
          >
            <Film className="size-16 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Nhan de chon video</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </>
      )}

      {/* Step 2: Preview + Caption */}
      {step === 'preview' && previewUrl && (
        <>
          <header className="flex h-12 shrink-0 items-center justify-between border-b px-4">
            <Button variant="ghost" size="icon" onClick={handleClose} aria-label="Dong">
              <X className="size-5" />
            </Button>
            <h1 className="text-sm font-semibold">Reel moi</h1>
            <Button size="sm" onClick={handlePublish}>
              Dang reel
            </Button>
          </header>
          <div className="flex flex-1 flex-col overflow-y-auto">
            {/* Video preview */}
            <div className="relative mx-auto aspect-[9/16] w-full max-w-sm bg-black">
              <video
                src={previewUrl}
                className="h-full w-full object-contain"
                controls
                playsInline
              />
            </div>
            {/* Caption */}
            <div className="p-4">
              <Textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Viet chu thich..."
                maxLength={REEL_LIMITS.maxCaptionLength}
                className="min-h-[80px] resize-none"
                rows={3}
              />
              {/* Linked items */}
              <div className="mt-3">
                {linkedItems.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1">
                    {linkedItems.map((item) => (
                      <span key={item.id} className="rounded-full bg-muted px-2 py-0.5 text-xs">
                        {item.name}
                      </span>
                    ))}
                  </div>
                )}
                <Button variant="outline" size="sm" onClick={() => setItemPickerOpen(true)}>
                  <Plus className="mr-1 size-4" />
                  Lien ket item
                </Button>
              </div>
            </div>
          </div>
          <ItemPicker
            mode="multi"
            selectedItemIds={linkedItemIds}
            onSelect={handleItemSelect}
            open={itemPickerOpen}
            onOpenChange={setItemPickerOpen}
          />
        </>
      )}

      {/* Step 3: Processing */}
      {step === 'processing' && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <Loader2 className="size-12 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Dang xu ly video...</p>
        </div>
      )}
    </div>
  );
}
