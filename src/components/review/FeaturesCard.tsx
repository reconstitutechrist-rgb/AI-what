'use client';

/**
 * Features Card - Displays feature list for review
 *
 * Read-only priority-sorted list of features from the app concept.
 */

import type { Feature } from '@/types/appConcept';

interface FeaturesCardProps {
  features: Feature[] | undefined;
}

// Priority order for sorting
const priorityOrder = { high: 0, medium: 1, low: 2 };

// Priority badge styles
function getPriorityBadgeStyle(priority: 'high' | 'medium' | 'low'): React.CSSProperties {
  switch (priority) {
    case 'high':
      return {
        background: 'var(--error-muted, rgba(239, 68, 68, 0.1))',
        color: 'var(--error-primary, #ef4444)',
      };
    case 'medium':
      return {
        background: 'var(--warning-muted, rgba(245, 158, 11, 0.1))',
        color: 'var(--warning-primary, #f59e0b)',
      };
    case 'low':
      return {
        background: 'var(--success-muted, rgba(34, 197, 94, 0.1))',
        color: 'var(--success-primary, #22c55e)',
      };
  }
}

export function FeaturesCard({ features }: FeaturesCardProps) {
  // Sort by priority
  const sortedFeatures = [...(features || [])].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );

  return (
    <div
      className="p-6 rounded-xl"
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          Features
        </h2>
        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {sortedFeatures.length} feature{sortedFeatures.length !== 1 ? 's' : ''}
        </span>
      </div>

      {sortedFeatures.length > 0 ? (
        <ul className="space-y-2">
          {sortedFeatures.map((feature) => (
            <li
              key={feature.id}
              className="flex items-start gap-3 p-3 rounded-lg"
              style={{ background: 'var(--bg-tertiary)' }}
            >
              <span
                className="flex-shrink-0 px-2 py-0.5 rounded text-xs font-medium capitalize"
                style={getPriorityBadgeStyle(feature.priority)}
              >
                {feature.priority}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {feature.name}
                </p>
                {feature.description && (
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    {feature.description}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>
          No features defined
        </p>
      )}
    </div>
  );
}

export default FeaturesCard;
