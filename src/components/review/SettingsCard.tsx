'use client';

/**
 * Settings Card - Build settings configuration for review
 *
 * Allows user to configure build settings before proceeding to Builder.
 */

import { Settings } from 'lucide-react';
import type { BuildSettings } from '@/types/reviewTypes';

interface SettingsCardProps {
  settings: BuildSettings;
  onChange: (settings: Partial<BuildSettings>) => void;
}

export function SettingsCard({ settings, onChange }: SettingsCardProps) {
  return (
    <div
      className="p-6 rounded-xl"
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Settings className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          Build Settings
        </h2>
      </div>

      <div className="space-y-4">
        {/* Auto-advance toggle */}
        <label className="flex items-center justify-between cursor-pointer group">
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Auto-advance phases
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Automatically proceed to next phase when one completes
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.autoAdvance}
            onClick={() => onChange({ autoAdvance: !settings.autoAdvance })}
            className={`
              relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent
              transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2
            `}
            style={{
              background: settings.autoAdvance ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
            }}
          >
            <span
              className={`
                pointer-events-none inline-block h-5 w-5 transform rounded-full shadow ring-0
                transition duration-200 ease-in-out
                ${settings.autoAdvance ? 'translate-x-5' : 'translate-x-0'}
              `}
              style={{ background: 'var(--bg-primary)' }}
            />
          </button>
        </label>
      </div>
    </div>
  );
}

export default SettingsCard;
