'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { motion } from 'framer-motion';
import LayoutBuilderWizard from '@/components/LayoutBuilderWizard';
import { useAppStore } from '@/store/useAppStore';

export default function DesignPage() {
  const router = useRouter();

  // Check if we have an app concept
  const appConcept = useAppStore((state) => state.appConcept);

  const handleComplete = useCallback(() => {
    // Navigate to next step: Build
    router.push('/app/build');
  }, [router]);

  const handleClose = useCallback(() => {
    router.push('/app');
  }, [router]);

  const handleBack = useCallback(() => {
    router.push('/app/wizard');
  }, [router]);

  const handleSkip = useCallback(() => {
    router.push('/app');
  }, [router]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="h-[calc(100vh-56px)] md:h-[calc(100vh-56px)]"
    >
      <LayoutBuilderWizard
        isOpen={true}
        onClose={handleClose}
        onApplyToAppConcept={handleComplete}
        isFullPage
      />

      {/* Navigation bar - Fixed bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0f]/90 backdrop-blur-xl border-t border-zinc-800 p-4 flex items-center justify-between z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-1"
          >
            ← Back to Wizard
          </button>
        </div>
        <p className="text-sm text-zinc-500 hidden sm:block">Step 2 of 4 — Design your layout</p>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSkip}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Skip to Builder →
          </button>
          <button
            onClick={handleComplete}
            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-lg shadow-lg shadow-blue-500/25 transition-all"
          >
            Continue to Build →
          </button>
        </div>
      </div>
    </motion.div>
  );
}
