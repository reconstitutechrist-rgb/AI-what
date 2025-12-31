'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { motion } from 'framer-motion';
import NaturalConversationWizard from '@/components/NaturalConversationWizard';
import { useAppStore } from '@/store/useAppStore';
import type { AppConcept } from '@/types/appConcept';
import type { DynamicPhasePlan } from '@/types/dynamicPhases';

export default function WizardPage() {
  const router = useRouter();

  // Store actions
  const setAppConcept = useAppStore((state) => state.setAppConcept);
  const setDynamicPhasePlan = useAppStore((state) => state.setDynamicPhasePlan);

  const handleComplete = useCallback(
    (concept: AppConcept, phasePlan?: DynamicPhasePlan | null) => {
      // Save to store
      setAppConcept(concept);
      if (phasePlan) {
        setDynamicPhasePlan(phasePlan);
      }
      // Navigate to next step: Design
      router.push('/app/design');
    },
    [router, setAppConcept, setDynamicPhasePlan]
  );

  const handleCancel = useCallback(() => {
    router.push('/app');
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
      <NaturalConversationWizard onComplete={handleComplete} onCancel={handleCancel} isFullPage />

      {/* Skip to Builder - Fixed bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0f]/90 backdrop-blur-xl border-t border-zinc-800 p-4 flex items-center justify-between z-40">
        <p className="text-sm text-zinc-500">Step 1 of 4 — Plan your app concept</p>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSkip}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Skip to Builder →
          </button>
          <button
            onClick={() => router.push('/app/design')}
            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-lg shadow-lg shadow-blue-500/25 transition-all"
          >
            Continue to Design →
          </button>
        </div>
      </div>
    </motion.div>
  );
}
