import { Clapperboard } from 'lucide-react';

export function ReelSkeleton() {
  return (
    <div className="flex h-[100dvh] w-full items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-4">
        <Clapperboard className="size-12 animate-pulse text-muted" />
      </div>
    </div>
  );
}
