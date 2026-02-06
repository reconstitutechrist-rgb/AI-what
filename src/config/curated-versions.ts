/**
 * Curated versions for dependencies not in project's package.json
 * These are used in generated full-stack apps but not in this project
 *
 * UPDATE QUARTERLY or when starting new features that use these
 * Last updated: 2025-12-16
 */
export const CURATED_VERSIONS = {
  // Database
  prisma: '^5.22.0',
  '@prisma/client': '^5.22.0',

  // Authentication
  'next-auth': '^4.24.0',
  '@auth/core': '^0.35.0',

  // API Layer
  '@trpc/server': '^10.45.0',
  '@trpc/client': '^10.45.0',
  '@trpc/react-query': '^10.45.0',
  '@tanstack/react-query': '^5.60.0',

  // Payments
  stripe: '^17.3.0',
  '@stripe/stripe-js': '^4.9.0',

  // File Upload
  uploadthing: '^7.3.0',
  '@uploadthing/react': '^7.1.0',

  // Email
  resend: '^4.0.0',
  nodemailer: '^6.9.15',

  // Real-time
  pusher: '^5.2.0',
  'pusher-js': '^8.4.0',

  // Form Handling
  'react-hook-form': '^7.54.0',
  '@hookform/resolvers': '^3.9.0',

  // UI Libraries (for generated apps)
  '@radix-ui/react-dialog': '^1.1.0',
  '@radix-ui/react-dropdown-menu': '^2.1.0',
  'lucide-react': '^0.465.0',
  'class-variance-authority': '^0.7.0',
  clsx: '^2.1.1',
  'tailwind-merge': '^2.5.0',

  // 3D / WebGL
  three: '^0.170.0',
  '@react-three/fiber': '^8.17.0',
  '@react-three/drei': '^9.117.0',
  '@react-three/postprocessing': '^2.16.0',
  '@react-three/rapier': '^2.0.0',
  '@dimforge/rapier3d-compat': '^0.14.0',

  // Animation
  'framer-motion': '^11.11.0',
  gsap: '^3.12.0',

  // Charts / Data Visualization
  recharts: '^2.13.0',
  'd3': '^7.9.0',
  'chart.js': '^4.4.0',
  'react-chartjs-2': '^5.2.0',

  // Maps
  'react-map-gl': '^7.1.0',
  'mapbox-gl': '^3.7.0',
} as const;

export type CuratedPackage = keyof typeof CURATED_VERSIONS;
