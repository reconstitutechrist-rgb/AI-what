'use client';

/**
 * Concept Card - Displays app concept summary for review
 *
 * Read-only card showing app name, description, and purpose.
 * Includes edit link to navigate back to Wizard.
 */

import { ArrowRight } from 'lucide-react';
import type { AppConcept } from '@/types/appConcept';

interface ConceptCardProps {
  concept: AppConcept;
  onEdit: () => void;
}

export function ConceptCard({ concept, onEdit }: ConceptCardProps) {
  return (
    <div
      className="p-6 rounded-xl"
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          App Concept
        </h2>
        <button
          onClick={onEdit}
          className="flex items-center gap-1 text-sm font-medium transition-colors hover:opacity-80"
          style={{ color: 'var(--accent-primary)' }}
        >
          Edit in Wizard
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            Name
          </span>
          <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
            {concept.name}
          </p>
        </div>

        <div>
          <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            Description
          </span>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {concept.description || 'No description provided'}
          </p>
        </div>

        {concept.purpose && (
          <div>
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Purpose
            </span>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {concept.purpose}
            </p>
          </div>
        )}

        {concept.targetUsers && (
          <div>
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Target Users
            </span>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {concept.targetUsers}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ConceptCard;
