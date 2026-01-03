'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { motion } from 'framer-motion';
import LayoutBuilderWizard from '@/components/LayoutBuilderWizard';

export default function DesignPage() {
  const router = useRouter();

  const handleComplete = useCallback(() => {
    // Navigate to next step: Build
    router.push('/app/build');
  }, [router]);

  const handleClose = useCallback(() => {
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
    </motion.div>
  );
}
