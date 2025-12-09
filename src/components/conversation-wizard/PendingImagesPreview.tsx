'use client';

import { XIcon } from '@/components/ui/Icons';

interface PendingImagesPreviewProps {
  images: string[];
  onRemove: (index: number) => void;
}

/**
 * Preview of pending images to be sent with the next message
 */
export function PendingImagesPreview({ images, onRemove }: PendingImagesPreviewProps) {
  if (images.length === 0) return null;

  return (
    <div className="px-6 py-2 flex gap-2">
      {images.map((img, i) => (
        <div key={`pending-${img.slice(-20)}`} className="relative">
          <img
            src={img}
            alt={`Upload ${i + 1}`}
            className="w-16 h-16 object-cover rounded-lg border border-zinc-700"
          />
          <button
            onClick={() => onRemove(i)}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center"
          >
            <XIcon size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}

export default PendingImagesPreview;
