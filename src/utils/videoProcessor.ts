import type { LayoutManifest } from '@/types/schema';

export interface VideoFrame {
  timestamp: number;
  image: string;
}

export interface VideoProcessingOptions {
  frameRate?: number;
  quality?: 'low' | 'medium' | 'high';
  /** Number of keyframes to extract (default: 3 - start, middle, end) */
  keyframeCount?: number;
  /** Maximum width for extracted frames (default: 1280) */
  maxWidth?: number;
}

/**
 * Process video content to extract visual layout information
 * Adapted for Gemini 3 Layout Engine
 */
export async function processVideoForLayout(
  videoUrl: string,
  _options: VideoProcessingOptions = {}
): Promise<Partial<LayoutManifest>> {
  console.log('Processing video for layout extraction...', videoUrl);

  // Stub implementation - Gemini handles actual video analysis
  return {
    designSystem: {
      colors: {
        primary: '#000000',
        secondary: '#666666',
        accent: '#000000',
        background: '#ffffff',
        surface: '#f5f5f5',
        text: '#333333',
        textMuted: '#888888',
        border: '#e5e5e5',
      },
      fonts: {
        heading: 'Inter',
        body: 'Inter',
      },
    },
  };
}

/**
 * Promise-based seek helper for video elements.
 * Allows using async/await instead of callback-based event handling.
 */
function seekTo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve) => {
    const onSeek = () => {
      video.removeEventListener('seeked', onSeek);
      resolve();
    };
    video.addEventListener('seeked', onSeek);
    video.currentTime = time;
  });
}

/**
 * Promise-based video metadata loading helper.
 */
function waitForMetadata(video: HTMLVideoElement): Promise<void> {
  return new Promise((resolve, reject) => {
    if (video.readyState >= 1) {
      resolve();
      return;
    }
    const onLoad = () => {
      video.removeEventListener('loadedmetadata', onLoad);
      video.removeEventListener('error', onError);
      resolve();
    };
    const onError = () => {
      video.removeEventListener('loadedmetadata', onLoad);
      video.removeEventListener('error', onError);
      reject(new Error(`Failed to load video: ${video.error?.message || 'Unknown error'}`));
    };
    video.addEventListener('loadedmetadata', onLoad);
    video.addEventListener('error', onError);
  });
}

/**
 * Calculate evenly distributed timestamps for keyframe extraction.
 * Avoids exact start/end which can be unreliable.
 */
function calculateTimestamps(duration: number, keyframeCount: number): number[] {
  if (keyframeCount === 1) {
    return [duration / 2]; // Just the middle
  }
  if (keyframeCount === 2) {
    return [0.5, duration - 0.5]; // Near start and end
  }
  // Evenly distribute, avoiding exact 0 and end
  const timestamps: number[] = [];
  const step = (duration - 1) / (keyframeCount - 1);
  for (let i = 0; i < keyframeCount; i++) {
    timestamps.push(Math.max(0.1, Math.min(0.5 + i * step, duration - 0.1)));
  }
  return timestamps;
}

/**
 * Extract keyframes from a video file for visual analysis.
 * Uses HTML5 video and canvas APIs to capture frames at specific timestamps.
 *
 * This enables "Video → Exact Vision" by providing Architect with raw visual frames
 * that can be analyzed for layout bounds and positioning.
 *
 * @param file - Video file to extract frames from
 * @param options - Processing options (keyframeCount, maxWidth, quality)
 * @returns Array of VideoFrame objects with timestamp and base64 image data
 */
export const extractKeyframes = async (
  file: File,
  options: VideoProcessingOptions = {}
): Promise<VideoFrame[]> => {
  const { keyframeCount = 3, maxWidth = 1280, quality = 'medium' } = options;

  // Browser-only check
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    console.warn('[videoProcessor] extractKeyframes requires browser environment');
    return [];
  }

  // Quality to JPEG quality mapping
  const qualityMap: Record<string, number> = {
    low: 0.6,
    medium: 0.85,
    high: 0.95,
  };

  const video = document.createElement('video');
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas 2D context');
  }

  // Create object URL for the video file
  const videoUrl = URL.createObjectURL(file);
  video.src = videoUrl;
  video.muted = true;
  video.playsInline = true;

  const cleanup = () => {
    URL.revokeObjectURL(videoUrl);
    video.remove();
    canvas.remove();
  };

  try {
    // Load video and start
    video.load();
    await waitForMetadata(video);

    const duration = video.duration;
    if (!duration || !isFinite(duration)) {
      throw new Error('Could not determine video duration');
    }

    console.log(`[videoProcessor] Video loaded: ${duration.toFixed(2)}s duration`);

    // Calculate timestamps
    const timestamps = calculateTimestamps(duration, keyframeCount);
    console.log(
      `[videoProcessor] Extracting ${keyframeCount} frames at:`,
      timestamps.map((t) => t.toFixed(2) + 's')
    );

    // Set canvas size based on video dimensions
    const aspectRatio = video.videoHeight / video.videoWidth;
    const width = Math.min(video.videoWidth, maxWidth);
    const height = Math.round(width * aspectRatio);
    canvas.width = width;
    canvas.height = height;

    // Extract frames using async/await pattern
    const frames: VideoFrame[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      const time = timestamps[i];
      await seekTo(video, time);

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', qualityMap[quality]);

      frames.push({
        timestamp: time,
        image: dataUrl,
      });

      console.log(
        `[videoProcessor] Captured frame ${i + 1}/${keyframeCount} at ${time.toFixed(2)}s`
      );
    }

    console.log(`[videoProcessor] Extracted ${frames.length} keyframes successfully`);
    return frames;
  } finally {
    cleanup();
  }
};

/**
 * Get video duration without fully loading the video.
 * Useful for preview/validation before extraction.
 */
export const getVideoDuration = async (file: File): Promise<number> => {
  if (typeof window === 'undefined') {
    return 0;
  }

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const videoUrl = URL.createObjectURL(file);
    video.src = videoUrl;
    video.muted = true;

    video.addEventListener('loadedmetadata', () => {
      const duration = video.duration;
      URL.revokeObjectURL(videoUrl);
      video.remove();
      resolve(isFinite(duration) ? duration : 0);
    });

    video.addEventListener('error', () => {
      URL.revokeObjectURL(videoUrl);
      video.remove();
      reject(new Error('Failed to load video metadata'));
    });

    video.load();
  });
};
