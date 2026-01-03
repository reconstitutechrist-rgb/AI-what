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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="h-[calc(100vh-56px)] md:h-[calc(100vh-56px)]"
    >
      <NaturalConversationWizard onComplete={handleComplete} onCancel={handleCancel} isFullPage />
    </motion.div>
  );
}
