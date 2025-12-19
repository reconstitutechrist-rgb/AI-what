'use client';

interface PreviewBannerProps {
  appTitle: string;
}

export default function PreviewBanner({ appTitle }: PreviewBannerProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-800 py-2 px-4 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span className="font-medium text-white">{appTitle}</span>
          <span>-</span>
          <span>Built with AI App Builder</span>
        </div>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          Create your own app
        </a>
      </div>
    </div>
  );
}
