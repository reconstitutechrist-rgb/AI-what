'use client';

import type { Feature, TechnicalRequirements } from '@/types/appConcept';
import type { DynamicPhasePlan } from '@/types/dynamicPhases';

interface WizardState {
  name?: string;
  description?: string;
  purpose?: string;
  targetUsers?: string;
  features: Feature[];
  technical: Partial<TechnicalRequirements>;
  roles?: Array<{ name: string; capabilities: string[] }>;
  isComplete: boolean;
}

interface ConceptSummaryPanelProps {
  wizardState: WizardState;
  phasePlan: DynamicPhasePlan | null;
  onStartBuilding: () => void;
}

/**
 * Side panel showing the concept summary and phase plan
 */
export function ConceptSummaryPanel({
  wizardState,
  phasePlan,
  onStartBuilding,
}: ConceptSummaryPanelProps) {
  return (
    <div className="w-80 border-l border-zinc-800 flex flex-col bg-zinc-900/50">
      <div className="p-4 border-b border-zinc-800">
        <h2 className="font-semibold text-zinc-100">Concept Summary</h2>
        <p className="text-sm text-zinc-400">
          {wizardState.isComplete ? 'Ready to build' : 'In progress...'}
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        {/* App Name */}
        <div>
          <label className="text-xs text-zinc-500 uppercase tracking-wide">App Name</label>
          <p className="mt-1 text-zinc-100">{wizardState.name || '—'}</p>
        </div>

        {/* Description */}
        {wizardState.description && (
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wide">Description</label>
            <p className="mt-1 text-sm text-zinc-300">{wizardState.description}</p>
          </div>
        )}

        {/* Target Users */}
        {wizardState.targetUsers && (
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wide">Target Users</label>
            <p className="mt-1 text-sm text-zinc-300">{wizardState.targetUsers}</p>
          </div>
        )}

        {/* Roles */}
        {wizardState.roles && wizardState.roles.length > 0 && (
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wide">User Roles</label>
            <ul className="mt-1 space-y-1">
              {wizardState.roles.map((role) => (
                <li key={role.name} className="text-sm text-zinc-300">
                  <strong className="text-zinc-100">{role.name}:</strong>{' '}
                  {role.capabilities.slice(0, 2).join(', ')}
                  {role.capabilities.length > 2 && ` +${role.capabilities.length - 2} more`}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Features */}
        {wizardState.features.length > 0 && (
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wide">
              Features ({wizardState.features.length})
            </label>
            <ul className="mt-1 space-y-1">
              {wizardState.features.slice(0, 6).map((feature) => (
                <li
                  key={feature.id || feature.name}
                  className="text-sm flex items-center gap-2 text-zinc-300"
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      feature.priority === 'high'
                        ? 'bg-red-400'
                        : feature.priority === 'medium'
                          ? 'bg-yellow-400'
                          : 'bg-green-400'
                    }`}
                  />
                  {feature.name}
                </li>
              ))}
              {wizardState.features.length > 6 && (
                <li className="text-sm text-zinc-500">
                  +{wizardState.features.length - 6} more features
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Technical */}
        {Object.values(wizardState.technical).some((v) => v !== undefined) && (
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wide">Technical</label>
            <div className="mt-1 flex flex-wrap gap-1">
              {wizardState.technical.needsAuth && (
                <span className="px-2 py-0.5 bg-blue-600/20 text-blue-300 rounded text-xs">
                  Auth
                </span>
              )}
              {wizardState.technical.needsDatabase && (
                <span className="px-2 py-0.5 bg-green-600/20 text-green-300 rounded text-xs">
                  Database
                </span>
              )}
              {wizardState.technical.needsRealtime && (
                <span className="px-2 py-0.5 bg-purple-600/20 text-purple-300 rounded text-xs">
                  Real-time
                </span>
              )}
              {wizardState.technical.needsFileUpload && (
                <span className="px-2 py-0.5 bg-orange-600/20 text-orange-300 rounded text-xs">
                  Files
                </span>
              )}
              {wizardState.technical.needsAPI && (
                <span className="px-2 py-0.5 bg-pink-600/20 text-pink-300 rounded text-xs">
                  API
                </span>
              )}
            </div>
          </div>
        )}

        {/* Phase Plan */}
        {phasePlan && (
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wide">
              Implementation Plan ({phasePlan.totalPhases} phases)
            </label>
            <div className="mt-2 space-y-1">
              {phasePlan.phases.slice(0, 5).map((phase) => (
                <div key={phase.number} className="flex items-center gap-2 text-sm text-zinc-300">
                  <span className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-xs text-zinc-400">
                    {phase.number}
                  </span>
                  <span className="truncate">{phase.name}</span>
                </div>
              ))}
              {phasePlan.phases.length > 5 && (
                <p className="text-sm text-zinc-500 pl-7">
                  +{phasePlan.phases.length - 5} more phases
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {phasePlan && (
        <div className="p-4 border-t border-zinc-800">
          <button onClick={onStartBuilding} className="btn-primary w-full py-2.5">
            Start Building
          </button>
        </div>
      )}
    </div>
  );
}

export default ConceptSummaryPanel;
