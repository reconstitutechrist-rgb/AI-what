'use client';

import { useState } from 'react';
import type { ArchitectureSpec } from '@/types/architectureSpec';

interface ArchitectureReviewPanelProps {
  architectureSpec: ArchitectureSpec;
  isGenerating: boolean;
  onProceed: () => void;
  onRegenerate: () => void;
}

/**
 * Side panel component to display and review generated backend architecture
 * Shows database schema, API routes, auth strategy, and architecture decisions
 */
export function ArchitectureReviewPanel({
  architectureSpec,
  isGenerating,
  onProceed,
  onRegenerate,
}: ArchitectureReviewPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    database: true,
    api: false,
    auth: false,
    decisions: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="w-96 border-l border-slate-800 flex flex-col bg-slate-900/50">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <h2 className="font-semibold text-slate-100 flex items-center gap-2">
          <span className="text-lg">🏗️</span>
          Backend Architecture
        </h2>
        <p className="text-sm text-slate-400 mt-1">Review the generated architecture</p>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* Database Section */}
        <CollapsibleSection
          title="Database Schema"
          icon="📊"
          badge={`${architectureSpec.database?.tables?.length || 0} tables`}
          isExpanded={expandedSections.database}
          onToggle={() => toggleSection('database')}
        >
          {architectureSpec.database?.prismaSchema ? (
            <div className="bg-slate-950 rounded border border-slate-800 overflow-hidden">
              <div className="px-3 py-1.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-mono">schema.prisma</span>
              </div>
              <pre className="p-3 text-xs text-slate-300 font-mono overflow-x-auto max-h-64 overflow-y-auto">
                {architectureSpec.database.prismaSchema}
              </pre>
            </div>
          ) : (
            <div className="space-y-2">
              {architectureSpec.database?.tables?.map((table) => (
                <div key={table.name} className="p-2 bg-slate-800/50 rounded">
                  <p className="text-sm font-medium text-slate-200">{table.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {table.fields?.length || 0} fields
                  </p>
                </div>
              ))}
            </div>
          )}
        </CollapsibleSection>

        {/* API Routes Section */}
        <CollapsibleSection
          title="API Routes"
          icon="🔌"
          badge={`${architectureSpec.api?.routes?.length || 0} endpoints`}
          isExpanded={expandedSections.api}
          onToggle={() => toggleSection('api')}
        >
          <div className="space-y-1">
            {architectureSpec.api?.routes?.map((route, idx) => (
              <div
                key={`${route.method}-${route.path}-${idx}`}
                className="p-2 bg-slate-800/50 rounded flex items-start gap-2"
              >
                <span
                  className={`px-1.5 py-0.5 rounded text-xs font-mono font-medium ${getMethodColor(route.method)}`}
                >
                  {route.method}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono text-slate-200 truncate">{route.path}</p>
                  {route.description && (
                    <p className="text-xs text-slate-400 mt-0.5">{route.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        {/* Authentication Section */}
        {architectureSpec.auth && (
          <CollapsibleSection
            title="Authentication"
            icon="🔐"
            badge={architectureSpec.auth.strategy || 'NextAuth'}
            isExpanded={expandedSections.auth}
            onToggle={() => toggleSection('auth')}
          >
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wide">Strategy</label>
                <p className="mt-0.5 text-sm text-slate-200">
                  {architectureSpec.auth.strategy || 'NextAuth.js'}
                </p>
              </div>

              {architectureSpec.auth.providers && architectureSpec.auth.providers.length > 0 && (
                <div>
                  <label className="text-xs text-slate-500 uppercase tracking-wide">
                    Providers
                  </label>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {architectureSpec.auth.providers.map((provider, idx) => (
                      <span
                        key={`${provider.type}-${provider.provider || idx}`}
                        className="px-2 py-0.5 bg-garden-600/20 text-garden-300 rounded text-xs"
                      >
                        {provider.provider || provider.type}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {architectureSpec.auth.rbac?.roles && architectureSpec.auth.rbac.roles.length > 0 && (
                <div>
                  <label className="text-xs text-slate-500 uppercase tracking-wide">
                    Roles (RBAC)
                  </label>
                  <div className="mt-1 space-y-1">
                    {architectureSpec.auth.rbac.roles.map((role) => {
                      // Find permissions for this role from rolePermissions
                      const rolePerms = architectureSpec.auth?.rbac?.rolePermissions?.find(
                        (rp) => rp.role === role.name
                      )?.permissions;
                      return (
                        <div key={role.name} className="p-2 bg-slate-800/50 rounded">
                          <p className="text-sm font-medium text-slate-200">{role.name}</p>
                          {rolePerms && rolePerms.length > 0 && (
                            <p className="text-xs text-slate-400 mt-0.5">
                              {rolePerms.slice(0, 3).join(', ')}
                              {rolePerms.length > 3 && ` +${rolePerms.length - 3} more`}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </CollapsibleSection>
        )}

        {/* Architecture Decisions Section */}
        {architectureSpec.architectureReasoning?.decisions &&
          architectureSpec.architectureReasoning.decisions.length > 0 && (
            <CollapsibleSection
              title="Key Decisions"
              icon="💡"
              badge={`${architectureSpec.architectureReasoning.decisions.length} decisions`}
              isExpanded={expandedSections.decisions}
              onToggle={() => toggleSection('decisions')}
            >
              <div className="space-y-2">
                {architectureSpec.architectureReasoning.decisions.map((decision, idx) => (
                  <div key={idx} className="p-2 bg-slate-800/50 rounded">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">
                      {decision.area}
                    </p>
                    <p className="text-sm text-slate-200 mt-0.5">{decision.decision}</p>
                    {decision.reasoning && (
                      <p className="text-xs text-slate-400 mt-1 italic">{decision.reasoning}</p>
                    )}
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-t border-slate-800 space-y-2">
        <button
          onClick={onProceed}
          disabled={isGenerating}
          className="btn-primary w-full py-2.5 disabled:opacity-50"
        >
          Proceed to Phases
        </button>
        <button
          onClick={onRegenerate}
          disabled={isGenerating}
          className="w-full py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50"
        >
          {isGenerating ? 'Regenerating...' : 'Regenerate Architecture'}
        </button>
      </div>
    </div>
  );
}

/**
 * Collapsible section component for organizing architecture details
 */
function CollapsibleSection({
  title,
  icon,
  badge,
  isExpanded,
  onToggle,
  children,
}: {
  title: string;
  icon: string;
  badge?: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-slate-800">
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span>{icon}</span>
          <span className="font-medium text-slate-100">{title}</span>
          {badge && (
            <span className="px-1.5 py-0.5 bg-slate-700 text-slate-300 rounded text-xs">
              {badge}
            </span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isExpanded && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

/**
 * Get color class for HTTP method badge
 */
function getMethodColor(method: string): string {
  switch (method.toUpperCase()) {
    case 'GET':
      return 'bg-green-600/20 text-green-300';
    case 'POST':
      return 'bg-garden-600/20 text-garden-300';
    case 'PUT':
    case 'PATCH':
      return 'bg-yellow-600/20 text-yellow-300';
    case 'DELETE':
      return 'bg-red-600/20 text-red-300';
    default:
      return 'bg-slate-600/20 text-slate-300';
  }
}

export default ArchitectureReviewPanel;
