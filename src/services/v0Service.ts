/**
 * v0.dev Service
 *
 * React component generation using Vercel's v0.dev API.
 * Generates production-ready React + Tailwind components from
 * natural language descriptions.
 *
 * API: https://v0.dev/api (requires authentication)
 * Cost: FREE tier (10 generations/month), Pro $20/month
 *
 * Note: v0.dev API access requires Vercel account and API key.
 * This service provides the integration framework.
 */

export type Framework = 'react' | 'nextjs';
export type Styling = 'tailwind' | 'css-modules' | 'styled-components';

export interface V0GenerationRequest {
  prompt: string;
  framework?: Framework;
  styling?: Styling;
  includeTypes?: boolean;
  darkMode?: boolean;
  responsive?: boolean;
}

export interface V0GeneratedComponent {
  id: string;
  name: string;
  code: string;
  dependencies: string[];
  preview?: string;
  files: Array<{
    filename: string;
    content: string;
    language: 'tsx' | 'ts' | 'css';
  }>;
}

export interface V0GenerationResult {
  success: boolean;
  component?: V0GeneratedComponent;
  error?: string;
  usage?: {
    remaining: number;
    total: number;
    resetDate: string;
  };
}

// Component templates for common patterns (fallback when API unavailable)
const COMPONENT_TEMPLATES: Record<string, (options: V0GenerationRequest) => V0GeneratedComponent> =
  {
    'pricing-table': (options) => ({
      id: 'pricing-table-1',
      name: 'PricingTable',
      code: `
import React from 'react';

interface PricingTier {
  name: string;
  price: number;
  features: string[];
  highlighted?: boolean;
}

interface PricingTableProps {
  tiers: PricingTier[];
  period?: 'monthly' | 'yearly';
  onSelectTier?: (tier: PricingTier) => void;
}

export function PricingTable({ tiers, period = 'monthly', onSelectTier }: PricingTableProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
      {tiers.map((tier) => (
        <div
          key={tier.name}
          className={\`relative rounded-2xl p-8 \${
            tier.highlighted
              ? 'bg-gradient-to-b from-indigo-500 to-purple-600 text-white shadow-xl scale-105'
              : 'bg-white border border-gray-200 shadow-sm'
          }\`}
        >
          {tier.highlighted && (
            <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-indigo-100 px-4 py-1 text-sm font-medium text-indigo-700">
              Most Popular
            </span>
          )}
          <h3 className="text-lg font-semibold">{tier.name}</h3>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-4xl font-bold">\${tier.price}</span>
            <span className="text-sm opacity-70">/{period === 'monthly' ? 'mo' : 'yr'}</span>
          </div>
          <ul className="mt-6 space-y-3">
            {tier.features.map((feature, i) => (
              <li key={i} className="flex items-center gap-2">
                <svg className="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>
          <button
            onClick={() => onSelectTier?.(tier)}
            className={\`mt-8 w-full rounded-lg py-3 px-4 text-sm font-semibold transition \${
              tier.highlighted
                ? 'bg-white text-indigo-600 hover:bg-gray-100'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }\`}
          >
            Get Started
          </button>
        </div>
      ))}
    </div>
  );
}

// Example usage:
// <PricingTable tiers={[
//   { name: 'Starter', price: 9, features: ['Feature 1', 'Feature 2'] },
//   { name: 'Pro', price: 29, features: ['Everything in Starter', 'Feature 3'], highlighted: true },
//   { name: 'Enterprise', price: 99, features: ['Everything in Pro', 'Feature 4', 'Feature 5'] }
// ]} />
`.trim(),
      dependencies: ['react'],
      files: [
        {
          filename: 'PricingTable.tsx',
          content: '', // Same as code
          language: 'tsx',
        },
      ],
    }),

    'user-card': (options) => ({
      id: 'user-card-1',
      name: 'UserCard',
      code: `
import React from 'react';

interface UserCardProps {
  name: string;
  avatar?: string;
  role?: string;
  email?: string;
  stats?: Array<{ label: string; value: string | number }>;
  onMessage?: () => void;
  onFollow?: () => void;
}

export function UserCard({ name, avatar, role, email, stats, onMessage, onFollow }: UserCardProps) {
  return (
    <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg">
      <div className="flex flex-col items-center">
        <div className="relative">
          {avatar ? (
            <img
              src={avatar}
              alt={name}
              className="h-24 w-24 rounded-full object-cover ring-4 ring-indigo-50"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-3xl font-bold text-white">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-white bg-green-500" />
        </div>
        <h3 className="mt-4 text-xl font-semibold text-gray-900">{name}</h3>
        {role && <p className="text-sm text-gray-500">{role}</p>}
        {email && <p className="mt-1 text-sm text-indigo-600">{email}</p>}
      </div>

      {stats && stats.length > 0 && (
        <div className="mt-6 flex justify-center gap-6 border-t border-gray-100 pt-6">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <button
          onClick={onMessage}
          className="flex-1 rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
        >
          Message
        </button>
        <button
          onClick={onFollow}
          className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          Follow
        </button>
      </div>
    </div>
  );
}
`.trim(),
      dependencies: ['react'],
      files: [
        {
          filename: 'UserCard.tsx',
          content: '',
          language: 'tsx',
        },
      ],
    }),

    'data-table': (options) => ({
      id: 'data-table-1',
      name: 'DataTable',
      code: `
import React, { useState, useMemo } from 'react';

interface Column<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: T[keyof T], item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  searchable?: boolean;
  pageSize?: number;
}

export function DataTable<T extends { id: string | number }>({
  data,
  columns,
  onRowClick,
  searchable = true,
  pageSize = 10,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);

  const filteredData = useMemo(() => {
    let result = [...data];

    if (search) {
      result = result.filter((item) =>
        Object.values(item).some((val) =>
          String(val).toLowerCase().includes(search.toLowerCase())
        )
      );
    }

    if (sortKey) {
      result.sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }

    return result;
  }, [data, search, sortKey, sortDir]);

  const paginatedData = filteredData.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(filteredData.length / pageSize);

  const handleSort = (key: keyof T) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  return (
    <div className="w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {searchable && (
        <div className="border-b border-gray-200 p-4">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-sm rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  onClick={() => col.sortable && handleSort(col.key)}
                  className={\`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 \${
                    col.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                  }\`}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && sortKey === col.key && (
                      <span>{sortDir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedData.map((item) => (
              <tr
                key={item.id}
                onClick={() => onRowClick?.(item)}
                className={\`\${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}\`}
              >
                {columns.map((col) => (
                  <td key={String(col.key)} className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {col.render ? col.render(item[col.key], item) : String(item[col.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 px-6 py-3">
          <p className="text-sm text-gray-500">
            Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, filteredData.length)} of {filteredData.length}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="rounded px-3 py-1 text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="rounded px-3 py-1 text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
`.trim(),
      dependencies: ['react'],
      files: [
        {
          filename: 'DataTable.tsx',
          content: '',
          language: 'tsx',
        },
      ],
    }),
  };

/**
 * Generate a React component from a natural language prompt
 *
 * Note: In production, this would call the v0.dev API.
 * Currently uses template matching for common patterns.
 */
export async function generateComponent(request: V0GenerationRequest): Promise<V0GenerationResult> {
  const { prompt, framework = 'react', styling = 'tailwind', includeTypes = true } = request;

  const normalizedPrompt = prompt.toLowerCase();

  // Try to match common component patterns
  let matchedTemplate: keyof typeof COMPONENT_TEMPLATES | null = null;

  if (normalizedPrompt.includes('pricing') || normalizedPrompt.includes('price table')) {
    matchedTemplate = 'pricing-table';
  } else if (normalizedPrompt.includes('user card') || normalizedPrompt.includes('profile card')) {
    matchedTemplate = 'user-card';
  } else if (
    normalizedPrompt.includes('data table') ||
    normalizedPrompt.includes('table with sorting')
  ) {
    matchedTemplate = 'data-table';
  }

  if (matchedTemplate && COMPONENT_TEMPLATES[matchedTemplate]) {
    const component = COMPONENT_TEMPLATES[matchedTemplate](request);
    return {
      success: true,
      component,
      usage: {
        remaining: 9,
        total: 10,
        resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
    };
  }

  // For unmatched patterns, return a helpful message
  return {
    success: false,
    error: `Component generation for "${prompt}" requires v0.dev API access. Available templates: pricing-table, user-card, data-table`,
    usage: {
      remaining: 10,
      total: 10,
      resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
  };
}

/**
 * Get available component templates
 */
export function getAvailableTemplates(): Array<{
  id: string;
  name: string;
  description: string;
  keywords: string[];
}> {
  return [
    {
      id: 'pricing-table',
      name: 'Pricing Table',
      description: 'A responsive pricing comparison table with multiple tiers',
      keywords: ['pricing', 'plans', 'subscription', 'tiers'],
    },
    {
      id: 'user-card',
      name: 'User Profile Card',
      description: 'A user profile card with avatar, stats, and action buttons',
      keywords: ['user', 'profile', 'card', 'avatar'],
    },
    {
      id: 'data-table',
      name: 'Data Table',
      description: 'A sortable, searchable data table with pagination',
      keywords: ['table', 'data', 'list', 'sortable', 'pagination'],
    },
  ];
}

/**
 * Check v0.dev API quota status
 */
export async function checkQuota(): Promise<{
  remaining: number;
  total: number;
  resetDate: string;
}> {
  // Placeholder - would check actual API quota in production
  return {
    remaining: 10,
    total: 10,
    resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };
}

export default {
  generateComponent,
  getAvailableTemplates,
  checkQuota,
};
