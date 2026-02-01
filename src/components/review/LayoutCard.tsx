'use client';

/**
 * Layout Card - Displays layout thumbnail for review
 *
 * Shows captured layout preview image or fallback state.
 * Includes edit link to navigate back to Design page.
 */

import { ArrowRight, Image as ImageIcon } from 'lucide-react';
import type { LayoutThumbnail } from '@/types/reviewTypes';

interface LayoutCardProps {
  thumbnail: LayoutThumbnail | null;
  onEdit: () => void;
}

export function LayoutCard({ thumbnail, onEdit }: LayoutCardProps) {
  return (
    <div
      className="p-6 rounded-xl"
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          Layout Design
        </h2>
        <button
          onClick={onEdit}
          className="flex items-center gap-1 text-sm font-medium transition-colors hover:opacity-80"
          style={{ color: 'var(--accent-primary)' }}
        >
          Edit Design
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {thumbnail ? (
        <div className="relative">
          <img
            src={thumbnail.dataUrl}
            alt="Layout preview"
            className="rounded-lg w-full max-h-48 object-contain"
            style={{ background: 'var(--bg-tertiary)' }}
          />
          <div
            className="absolute bottom-2 right-2 px-2 py-1 rounded text-xs"
            style={{
              background: 'var(--bg-primary)',
              color: 'var(--text-muted)',
            }}
          >
            Captured {new Date(thumbnail.capturedAt).toLocaleTimeString()}
          </div>
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center py-8 rounded-lg"
          style={{ background: 'var(--bg-tertiary)' }}
        >
          <ImageIcon className="w-8 h-8 mb-2" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            No layout preview available
          </p>
          <button
            onClick={onEdit}
            className="mt-2 text-xs font-medium transition-colors hover:opacity-80"
            style={{ color: 'var(--accent-primary)' }}
          >
            Go to Design →
          </button>
        </div>
      )}
    </div>
  );
}

export default LayoutCard;
