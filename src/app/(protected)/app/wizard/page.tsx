'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import NaturalConversationWizard from '@/components/NaturalConversationWizard';
import { NameAppModal } from '@/components/modals';
import { useAppStore } from '@/store/useAppStore';
import type { AppConcept } from '@/types/appConcept';
import type { DynamicPhasePlan } from '@/types/dynamicPhases';

export default function WizardPage() {
  const router = useRouter();

  // Local state for naming modal
  const [appName, setAppName] = useState<string | null>(null);
  const [showNameModal, setShowNameModal] = useState(true);

  // Store actions
  const setAppConcept = useAppStore((state) => state.setAppConcept);
  const setDynamicPhasePlan = useAppStore((state) => state.setDynamicPhasePlan);
  const setCurrentAppId = useAppStore((state) => state.setCurrentAppId);
  const currentAppId = useAppStore((state) => state.currentAppId);

  const handleComplete = useCallback(
    (concept: AppConcept, phasePlan?: DynamicPhasePlan | null) => {
      // Generate a new appId if we don't have one yet
      // This ID will be used for documentation tracking
      const appId = currentAppId || crypto.randomUUID();
      if (!currentAppId) {
        setCurrentAppId(appId);
      }

      // Save to store
      setAppConcept(concept);
      if (phasePlan) {
        setDynamicPhasePlan(phasePlan);
      }
      // Navigate to next step: Design
      router.push('/app/design');
    },
    [router, setAppConcept, setDynamicPhasePlan, setCurrentAppId, currentAppId]
  );

  const handleCancel = useCallback(() => {
    router.push('/app');
  }, [router]);

  // Handle name submission from modal
  const handleNameSubmit = useCallback((name: string) => {
    setAppName(name);
    setShowNameModal(false);
  }, []);

  // Handle modal cancel - go back to dashboard
  const handleNameModalClose = useCallback(() => {
    router.push('/app/dashboard');
  }, [router]);

  return (
    <>
      {/* Show naming modal if no app name yet */}
      {showNameModal && !appName && (
        <NameAppModal isOpen={true} onClose={handleNameModalClose} onSubmit={handleNameSubmit} />
      )}

      {/* Show wizard only after app is named */}
      {appName && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="h-[calc(100vh-56px)] md:h-[calc(100vh-56px)]"
        >
          <NaturalConversationWizard
            onComplete={handleComplete}
            onCancel={handleCancel}
            initialConcept={{ name: appName }}
            isFullPage
          />
        </motion.div>
      )}
    </>
  );
}
