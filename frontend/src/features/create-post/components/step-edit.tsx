'use client';

import { useCallback } from 'react';
import { useCreatePostStore } from '../stores/create-post-store';
import { ImageCropper } from './image-cropper';
import { cn } from '@/lib/utils';

export function StepEdit() {
  const images = useCreatePostStore((s) => s.images);
  const activeImageIndex = useCreatePostStore((s) => s.activeImageIndex);
  const setActiveImageIndex = useCreatePostStore((s) => s.setActiveImageIndex);
  const updateImageCrop = useCreatePostStore((s) => s.updateImageCrop);

  const activeImage = images[activeImageIndex];

  const handleCropComplete = useCallback(
    (
      croppedAreaPixels: {
        x: number;
        y: number;
        width: number;
        height: number;
      },
      rotation: number,
    ) => {
      updateImageCrop(activeImageIndex, croppedAreaPixels, rotation);
    },
    [activeImageIndex, updateImageCrop],
  );

  if (!activeImage) return null;

  return (
    <div className="flex h-full flex-col">
      {/* Main cropper area */}
      <div className="flex-1 overflow-hidden">
        <ImageCropper
          key={activeImageIndex}
          imageSrc={activeImage.previewUrl}
          initialRotation={activeImage.rotation}
          onCropComplete={handleCropComplete}
        />
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto border-t bg-background px-4 py-3">
          {images.map((img, index) => (
            <button
              key={img.previewUrl}
              type="button"
              onClick={() => setActiveImageIndex(index)}
              className={cn(
                'size-14 shrink-0 overflow-hidden rounded-md ring-2 ring-offset-1 transition-all',
                index === activeImageIndex
                  ? 'ring-primary'
                  : 'ring-transparent hover:ring-muted-foreground/30',
              )}
              aria-label={`Chinh sua anh ${index + 1}`}
            >
              <img
                src={img.previewUrl}
                alt={`Anh ${index + 1}`}
                className="size-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
