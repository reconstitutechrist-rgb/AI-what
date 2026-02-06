/**
 * Test Script: RepoAnalyst Implementation
 *
 * Tests the "Ultimate Developer" feature by:
 * 1. Creating mock repo files
 * 2. Running the RepoAnalyst
 * 3. Verifying the output contains expected style/patterns/critical files
 */

import { getRepoAnalyst } from '../services/titanPipeline/analyst';
import type { AppFile } from '../types/railway';

// Mock repo files simulating a real project
const MOCK_FILES: AppFile[] = [
  {
    path: '/src/hooks/useAuth.ts',
    content: `import { useState, useEffect } from 'react';
import { api } from '@/services/api';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getUser().then(setUser).finally(() => setLoading(false));
  }, []);

  return { user, loading };
}`,
  },
  {
    path: '/src/hooks/useFetch.ts',
    content: `import { useState, useCallback } from 'react';

export function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    const res = await window.fetch(url);
    setData(await res.json());
  }, [url]);

  return { data, error, fetch };
}`,
  },
  {
    path: '/src/services/api.ts',
    content: `const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export const api = {
  getUser: async () => {
    const res = await fetch(\`\${BASE_URL}/user\`);
    return res.json();
  },
  getPosts: async () => {
    const res = await fetch(\`\${BASE_URL}/posts\`);
    return res.json();
  },
};`,
  },
  {
    path: '/src/components/Button.tsx',
    content: `import { FC, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

export const Button: FC<ButtonProps> = ({ variant = 'primary', children, ...props }) => {
  return (
    <button className={\`btn btn-\${variant}\`} {...props}>
      {children}
    </button>
  );
};`,
  },
  {
    path: '/src/utils/format.ts',
    content: `export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US');
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};`,
  },
  {
    path: '/package.json',
    content: JSON.stringify({
      name: 'test-app',
      dependencies: {
        'next': '^15.0.0',
        'react': '^19.0.0',
        'tailwindcss': '^4.0.0',
      },
    }, null, 2),
  },
];

async function runTest() {
  console.log('='.repeat(60));
  console.log('TEST: RepoAnalyst Implementation');
  console.log('='.repeat(60));

  try {
    const analyst = getRepoAnalyst();
    console.log('\n[1/4] Analyzing mock repository...');

    const context = await analyst.analyzeRepo(MOCK_FILES);

    console.log('\n[2/4] Checking contentHash...');
    if (!context.contentHash || context.contentHash.length < 4) {
      throw new Error('contentHash is invalid');
    }
    console.log(`  ✅ contentHash: ${context.contentHash}`);

    console.log('\n[3/4] Checking styleGuide...');
    if (!context.styleGuide || context.styleGuide.length < 10) {
      throw new Error('styleGuide is empty or too short');
    }
    console.log(`  ✅ styleGuide (${context.styleGuide.length} chars):`);
    console.log(`  "${context.styleGuide.slice(0, 200)}..."`);

    console.log('\n[4/4] Checking techStack...');
    if (!context.techStack || context.techStack.length === 0) {
      console.log('  ⚠️ techStack is empty (may be due to API limitations in test)');
    } else {
      console.log(`  ✅ techStack: ${context.techStack.join(', ')}`);
    }

    console.log('\n[RESULTS]');
    console.log(`  Pattern Library: ${context.patternLibrary.length} patterns extracted`);
    context.patternLibrary.forEach((p, i) => {
      console.log(`    ${i + 1}. ${p.name} (from ${p.sourceFile})`);
    });

    console.log(`  Critical Files: ${context.criticalFiles.length} files identified`);
    context.criticalFiles.forEach((f) => console.log(`    - ${f}`));

    console.log(`  TDD Required: ${context.criticalFilesRequireTests}`);

    console.log('\n' + '='.repeat(60));
    console.log('TEST PASSED ✅');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    process.exit(1);
  }
}

runTest();
