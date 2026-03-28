'use client';

import { useCallback, useRef, useState } from 'react';
import { X, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { STORY_LIMITS } from '@figly/shared';
import { Button } from '@/components/ui/button';
import { useCreateStoryStore } from '@/stores/create-story-store';
import { useCreateStory } from '@/hooks/queries/story-queries';
import { apiClient } from '@/lib/api-client';

export function CreateStoryFlow() {
  const step = useCreateStoryStore((s) => s.step);
  const file = useCreateStoryStore((s) => s.file);
  const previewUrl = useCreateStoryStore((s) => s.previewUrl);
  const mediaType = useCreateStoryStore((s) => s.mediaType);
  const setFile = useCreateStoryStore((s) => s.setFile);
  const setStep = useCreateStoryStore((s) => s.setStep);
  const reset = useCreateStoryStore((s) => s.reset);

  const createStory = useCreateStory();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (!selectedFile) return;

      // Image size validation
      if (
        selectedFile.type.startsWith('image/') &&
        selectedFile.size > STORY_LIMITS.maxImageSize
      ) {
        toast.error('Hinh anh khong duoc vuot qua 10MB');
        return;
      }

      // Video size validation
      if (
        selectedFile.type.startsWith('video/') &&
        selectedFile.size > STORY_LIMITS.maxVideoSize
      ) {
        toast.error('Video khong duoc vuot qua 30MB');
        return;
      }

      // Video duration validation (client-side)
      if (selectedFile.type.startsWith('video/')) {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
          URL.revokeObjectURL(video.src);
          if (video.duration > STORY_LIMITS.maxDurationSeconds) {
            toast.error('Video khong duoc vuot qua 15 giay');
            return;
          }
          setFile(selectedFile);
        };
        video.src = URL.createObjectURL(selectedFile);
        return;
      }

      setFile(selectedFile);
    },
    [setFile],
  );

  const handlePost = useCallback(async () => {
    if (!file) return;

    setIsUploading(true);
    setStep('uploading');

    try {
      // 1. Upload file
      const formData = new FormData();
      formData.append('file', file, file.name);

      const uploadResponse = await apiClient.post<{ id: string }>(
        '/media/upload',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );

      const mediaId = uploadResponse.data.id;

      // 2. Wait for media processing (poll status)
      if (mediaType === 'image') {
        let attempts = 0;
        const maxAttempts = 10;
        while (attempts < maxAttempts) {
          const statusResponse = await apiClient.get(
            `/media/${mediaId}/status`,
          );
          if (statusResponse.data.status === 'COMPLETED') break;
          await new Promise((resolve) => setTimeout(resolve, 500));
          attempts++;
        }
      }

      // 3. Create story
      await createStory.mutateAsync(mediaId);

      // 4. Success -- reset flow
      reset();
    } catch {
      toast.error('Khong the tai len. Kiem tra ket noi mang va thu lai.');
      setStep('preview');
    } finally {
      setIsUploading(false);
    }
  }, [file, mediaType, createStory, reset, setStep]);

  if (step === 'idle') return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background">
      {/* Header */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b px-4">
        {step === 'select' ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={reset}
            aria-label="Dong"
          >
            <X className="size-5" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setStep('select')}
            disabled={isUploading}
            aria-label="Quay lai"
          >
            <ArrowLeft className="size-5" />
          </Button>
        )}

        <h1 className="text-sm font-semibold">Them story</h1>

        {step === 'preview' || step === 'uploading' ? (
          <Button size="sm" onClick={handlePost} disabled={isUploading}>
            {isUploading ? (
              <Loader2 className="mr-1 size-4 animate-spin" />
            ) : null}
            Dang story
          </Button>
        ) : (
          <div className="w-20" />
        )}
      </header>

      {/* Content */}
      <div className="flex flex-1 items-center justify-center overflow-hidden">
        {step === 'select' && (
          <div className="flex flex-col items-center gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={() => fileInputRef.current?.click()}
            >
              Chon hinh anh hoac video
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        )}

        {(step === 'preview' || step === 'uploading') && previewUrl && (
          <div className="relative size-full">
            {mediaType === 'video' ? (
              <video
                src={previewUrl}
                className="size-full object-contain"
                controls
                playsInline
              />
            ) : (
              <img
                src={previewUrl}
                alt="Story preview"
                className="size-full object-contain"
              />
            )}
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <Loader2 className="size-8 animate-spin text-white" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
