'use client';

import { useCallback, useState } from 'react';
import { X, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useCreatePostStore } from '@/stores/create-post-store';
import { getCroppedImg } from '@/lib/crop-image';
import { apiClient } from '@/lib/api-client';
import { useCreatePost } from '@/hooks/queries/post-queries';
import { StepGallery } from './step-gallery';
import { StepEdit } from './step-edit';
import { StepCaption } from './step-caption';

const STEP_TITLES: Record<string, string> = {
  gallery: 'Tao bai viet moi',
  edit: 'Chinh sua',
  caption: 'Bai viet moi',
};

export function CreatePostFlow() {
  const isOpen = useCreatePostStore((s) => s.isOpen);
  const step = useCreatePostStore((s) => s.step);
  const images = useCreatePostStore((s) => s.images);
  const caption = useCreatePostStore((s) => s.caption);
  const isPublishing = useCreatePostStore((s) => s.isPublishing);
  const close = useCreatePostStore((s) => s.close);
  const setStep = useCreatePostStore((s) => s.setStep);
  const setCroppedBlob = useCreatePostStore((s) => s.setCroppedBlob);
  const setPublishing = useCreatePostStore((s) => s.setPublishing);
  const setMediaId = useCreatePostStore((s) => s.setMediaId);

  const createPostMutation = useCreatePost();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBack = useCallback(() => {
    if (step === 'edit') setStep('gallery');
    else if (step === 'caption') setStep('edit');
  }, [step, setStep]);

  const handleNext = useCallback(async () => {
    if (step === 'gallery') {
      setStep('edit');
    } else if (step === 'edit') {
      // Process all images through getCroppedImg before advancing
      setIsProcessing(true);
      try {
        for (let i = 0; i < images.length; i++) {
          const img = images[i];
          const crop = img.croppedAreaPixels;
          if (crop) {
            const blob = await getCroppedImg(img.previewUrl, crop, img.rotation);
            setCroppedBlob(i, blob);
          } else {
            // No crop set -- use default (full image as blob)
            const response = await fetch(img.previewUrl);
            const blob = await response.blob();
            setCroppedBlob(i, blob);
          }
        }
        setStep('caption');
      } catch {
        toast.error('Loi khi xu ly hinh anh. Vui long thu lai.');
      } finally {
        setIsProcessing(false);
      }
    }
  }, [step, images, setStep, setCroppedBlob]);

  const handlePublish = useCallback(async () => {
    setPublishing(true);
    try {
      // 1. Upload each cropped image
      const currentImages = useCreatePostStore.getState().images;
      const mediaIds: string[] = [];

      for (let i = 0; i < currentImages.length; i++) {
        const img = currentImages[i];
        const blob = img.croppedBlob;
        if (!blob) {
          throw new Error('Hinh anh chua duoc xu ly');
        }

        const formData = new FormData();
        formData.append('file', blob, `image-${i}.jpg`);

        const uploadResponse = await apiClient.post<{ id: string }>('/media/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        mediaIds.push(uploadResponse.data.id);
        setMediaId(i, uploadResponse.data.id);
      }

      // 2. Create post with all mediaIds and linked items
      const currentLinkedItemIds = useCreatePostStore.getState().linkedItemIds;
      await createPostMutation.mutateAsync({
        mediaIds,
        caption: caption || undefined,
        linkedItemIds: currentLinkedItemIds.length > 0 ? currentLinkedItemIds : undefined,
      });

      toast.success('Bai viet da duoc dang!');
      close();
    } catch {
      toast.error('Dang bai that bai. Vui long thu lai.');
    } finally {
      setPublishing(false);
    }
  }, [caption, close, createPostMutation, setMediaId, setPublishing]);

  if (!isOpen) return null;

  const canAdvance = step === 'gallery' ? images.length > 0 : true;
  const isBusy = isPublishing || isProcessing;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Header */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b px-4">
        {/* Left: Close or Back */}
        {step === 'gallery' ? (
          <Button variant="ghost" size="icon" onClick={close} disabled={isBusy} aria-label="Dong">
            <X className="size-5" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            disabled={isBusy}
            aria-label="Quay lai"
          >
            <ArrowLeft className="size-5" />
          </Button>
        )}

        {/* Center: Title */}
        <h1 className="text-sm font-semibold">{STEP_TITLES[step]}</h1>

        {/* Right: Next / Share */}
        {step === 'caption' ? (
          <Button size="sm" onClick={handlePublish} disabled={!canAdvance || isBusy}>
            {isPublishing ? <Loader2 className="mr-1 size-4 animate-spin" /> : null}
            Chia se
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="font-semibold text-primary"
            onClick={handleNext}
            disabled={!canAdvance || isBusy}
          >
            {isProcessing ? <Loader2 className="mr-1 size-4 animate-spin" /> : null}
            Tiep
          </Button>
        )}
      </header>

      {/* Step content */}
      <div className="flex-1 overflow-hidden">
        {step === 'gallery' && <StepGallery />}
        {step === 'edit' && <StepEdit />}
        {step === 'caption' && <StepCaption />}
      </div>
    </div>
  );
}
