'use client';

/**
 * ConceptTab - Displays app concept summary
 */

import React from 'react';
import { TargetIcon, ZapIcon, SettingsIcon, GitBranchIcon } from '@/components/ui/Icons';
import type { ConceptSnapshot } from '@/types/projectDocumentation';

interface ConceptTabProps {
  snapshot: ConceptSnapshot;
}

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

function Section({ icon, title, children }: SectionProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-zinc-400">{icon}</span>
        <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const config: Record<string, string> = {
    high: 'bg-red-500/20 text-red-400',
    medium: 'bg-yellow-500/20 text-yellow-400',
    low: 'bg-green-500/20 text-green-400',
  };

  return (
    <span
      className={`px-1.5 py-0.5 rounded text-xs font-medium ${config[priority] || config.medium}`}
    >
      {priority}
    </span>
  );
}

export function ConceptTab({ snapshot }: ConceptTabProps) {
  return (
    <div className="p-4">
      {/* App Name & Description */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-zinc-100 mb-2">{snapshot.name}</h2>
        {snapshot.description && <p className="text-zinc-400 text-sm">{snapshot.description}</p>}
        <div className="text-xs text-zinc-600 mt-2">
          Source: {snapshot.source} | Captured: {new Date(snapshot.capturedAt).toLocaleString()}
        </div>
      </div>

      {/* Purpose */}
      {snapshot.purpose && (
        <Section icon={<TargetIcon size={16} />} title="Purpose">
          <p className="text-zinc-300 text-sm">{snapshot.purpose}</p>
        </Section>
      )}

      {/* Target Users */}
      {snapshot.targetUsers && (
        <Section icon={<TargetIcon size={16} />} title="Target Users">
          <p className="text-zinc-300 text-sm">{snapshot.targetUsers}</p>
        </Section>
      )}

      {/* Features */}
      {snapshot.features && snapshot.features.length > 0 && (
        <Section icon={<ZapIcon size={16} />} title="Features">
          <ul className="space-y-2">
            {snapshot.features.map((feature, index) => (
              <li key={feature.id || index} className="flex items-start gap-2 text-sm">
                <span className="text-zinc-600 mt-0.5">{index + 1}.</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-200 font-medium">{feature.name}</span>
                    <PriorityBadge priority={feature.priority} />
                  </div>
                  {feature.description && (
                    <p className="text-zinc-500 text-xs mt-0.5">{feature.description}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Technical Requirements */}
      <Section icon={<SettingsIcon size={16} />} title="Technical Requirements">
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: 'needsAuth', label: 'Authentication' },
            { key: 'needsDatabase', label: 'Database' },
            { key: 'needsAPI', label: 'API Integration' },
            { key: 'needsFileUpload', label: 'File Upload' },
            { key: 'needsRealtime', label: 'Real-time' },
          ].map(({ key, label }) => {
            const value = snapshot.technical[key as keyof typeof snapshot.technical];
            return (
              <div
                key={key}
                className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs ${
                  value ? 'bg-green-500/10 text-green-400' : 'bg-zinc-800/50 text-zinc-500'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${value ? 'bg-green-400' : 'bg-zinc-600'}`}
                />
                {label}
              </div>
            );
          })}
        </div>
        {snapshot.technical.authType && (
          <div className="mt-2 text-xs text-zinc-500">Auth Type: {snapshot.technical.authType}</div>
        )}
      </Section>

      {/* Roles */}
      {snapshot.roles && snapshot.roles.length > 0 && (
        <Section icon={<TargetIcon size={16} />} title="User Roles">
          <div className="space-y-2">
            {snapshot.roles.map((role, index) => (
              <div key={index} className="bg-zinc-800/50 rounded-lg p-2">
                <div className="text-sm font-medium text-zinc-200">{role.name}</div>
                {role.capabilities && role.capabilities.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {role.capabilities.map((cap, i) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 bg-zinc-700 rounded text-xs text-zinc-400"
                      >
                        {cap}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Workflows */}
      {snapshot.workflows && snapshot.workflows.length > 0 && (
        <Section icon={<GitBranchIcon size={16} />} title="Workflows">
          <div className="space-y-3">
            {snapshot.workflows.map((workflow, index) => (
              <div key={index} className="bg-zinc-800/50 rounded-lg p-2">
                <div className="text-sm font-medium text-zinc-200 mb-1">{workflow.name}</div>
                <div className="space-y-1">
                  {workflow.steps.map((step, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-zinc-400">
                      <span className="text-zinc-600">{i + 1}.</span>
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Conversation Summary */}
      {snapshot.conversationSummary && (
        <Section icon={<TargetIcon size={16} />} title="Planning Context">
          <div className="bg-zinc-800/50 rounded-lg p-3 text-xs text-zinc-400 max-h-40 overflow-y-auto">
            {snapshot.conversationSummary}
          </div>
        </Section>
      )}
    </div>
  );
}

export default ConceptTab;
