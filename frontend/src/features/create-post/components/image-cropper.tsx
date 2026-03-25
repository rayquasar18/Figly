'use client';

import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';
import { RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageCropperProps {
  imageSrc: string;
  initialCrop?: { x: number; y: number };
  initialZoom?: number;
  initialRotation?: number;
  onCropComplete: (
    croppedAreaPixels: { x: number; y: number; width: number; height: number },
    rotation: number,
  ) => void;
}

export function ImageCropper({
  imageSrc,
  initialCrop,
  initialZoom = 1,
  initialRotation = 0,
  onCropComplete,
}: ImageCropperProps) {
  const [crop, setCrop] = useState<Point>(initialCrop || { x: 0, y: 0 });
  const [zoom, setZoom] = useState(initialZoom);
  const [rotation, setRotation] = useState(initialRotation);

  const handleCropComplete = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      onCropComplete(croppedAreaPixels, rotation);
    },
    [onCropComplete, rotation],
  );

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  return (
    <div className="relative flex h-full flex-col">
      {/* Crop area */}
      <div className="relative flex-1">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={1}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={handleCropComplete}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 border-t bg-background px-4 py-3">
        {/* Zoom slider */}
        <label className="flex flex-1 items-center gap-2">
          <span className="text-xs text-muted-foreground">Phong to</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1"
          />
        </label>

        {/* Rotate button */}
        <Button variant="ghost" size="icon" onClick={handleRotate} aria-label="Xoay anh">
          <RotateCw className="size-4" />
        </Button>
      </div>
    </div>
  );
}
