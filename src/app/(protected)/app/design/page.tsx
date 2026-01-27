'use client';

import { motion } from 'framer-motion';
import { LayoutBuilderView } from '@/components/LayoutBuilderView';

export default function DesignPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="h-[calc(100vh-56px)] md:h-[calc(100vh-56px)]"
    >
      <LayoutBuilderView />
    </motion.div>
  );
}
