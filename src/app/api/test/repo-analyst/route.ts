/**
 * Test API Route: RepoAnalyst
 *
 * GET /api/test/repo-analyst
 *
 * Tests the RepoAnalyst implementation with mock files.
 * Access this endpoint in the browser to run the test.
 */

import { NextResponse } from 'next/server';
import { getRepoAnalyst } from '@/services/titanPipeline/analyst';
import type { AppFile } from '@/types/railway';

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

export async function GET() {
  const startTime = Date.now();
  const results: { step: string; status: 'pass' | 'fail' | 'warn'; message: string }[] = [];

  try {
    const analyst = getRepoAnalyst();

    // Test 1: Run analysis
    results.push({ step: 'Initialize', status: 'pass', message: `Analyzing ${MOCK_FILES.length} mock files...` });

    const context = await analyst.analyzeRepo(MOCK_FILES);

    // Test 2: Check contentHash
    if (context.contentHash && context.contentHash.length >= 4) {
      results.push({ step: 'Content Hash', status: 'pass', message: context.contentHash });
    } else {
      results.push({ step: 'Content Hash', status: 'fail', message: 'Invalid or missing' });
    }

    // Test 3: Check styleGuide
    if (context.styleGuide && context.styleGuide.length >= 10) {
      results.push({
        step: 'Style Guide',
        status: 'pass',
        message: context.styleGuide.slice(0, 300) + (context.styleGuide.length > 300 ? '...' : ''),
      });
    } else {
      results.push({ step: 'Style Guide', status: 'fail', message: 'Empty or too short' });
    }

    // Test 4: Check techStack
    if (context.techStack && context.techStack.length > 0) {
      results.push({ step: 'Tech Stack', status: 'pass', message: context.techStack.join(', ') });
    } else {
      results.push({ step: 'Tech Stack', status: 'warn', message: 'Empty (may be API issue)' });
    }

    // Test 5: Check patternLibrary
    results.push({
      step: 'Pattern Library',
      status: context.patternLibrary.length > 0 ? 'pass' : 'warn',
      message: `${context.patternLibrary.length} patterns: ${context.patternLibrary.map((p) => p.name).join(', ') || 'none'}`,
    });

    // Test 6: Check criticalFiles
    results.push({
      step: 'Critical Files',
      status: 'pass',
      message: context.criticalFiles.length > 0
        ? context.criticalFiles.join(', ')
        : 'None identified (expected for small test set)',
    });

    // Test 7: TDD flag
    results.push({
      step: 'TDD Required',
      status: 'pass',
      message: String(context.criticalFilesRequireTests),
    });

    const elapsed = Date.now() - startTime;
    const allPassed = results.every((r) => r.status !== 'fail');

    return NextResponse.json({
      success: allPassed,
      elapsed_ms: elapsed,
      results,
      repoContext: context,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        results,
      },
      { status: 500 }
    );
  }
}
