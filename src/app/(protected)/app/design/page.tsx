'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { LayoutPreview } from '@/components/LayoutPreview';
import { useAppStore } from '@/store/useAppStore';

export default function DesignPage() {
  const router = useRouter();
  const appConcept = useAppStore((state) => state.appConcept);

  const handleClose = useCallback(() => {
    router.push('/app');
  }, [router]);

  // Redirect if no concept (optional, or just show empty state)
  // if (!appConcept) {
  //   router.push('/app/wizard');
  //   return null;
  // }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="h-[calc(100vh-56px)] md:h-[calc(100vh-56px)]"
    >
      <LayoutPreview />
    </motion.div>
  );
}
