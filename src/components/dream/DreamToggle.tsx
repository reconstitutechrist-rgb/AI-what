/**
 * DreamToggle — Settings toggle component for Dream Mode
 *
 * Renders the Dream Mode configuration section in the Settings page.
 * Includes: repo URL, GitHub token, chaos profile selector, auto-commit toggle.
 * Links to /app/dream when enabled.
 */

'use client';

import React from 'react';
import { useSettings } from '@/hooks/useSettings';
import {
  ToggleSwitch,
  Select,
  TextInput,
  SectionHeader,
} from '@/components/ui/form';
import { CHAOS_PROFILE_META, CHAOS_PROFILE_NAMES } from '@/config/chaosProfile';
import type { ChaosProfileName } from '@/types/dream';

export function DreamToggle() {
  const { settings, updateDreamSettings } = useSettings();
  const { dream } = settings;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Dream Mode"
        description="Autonomous maintenance system. Loads a repository, discovers orphaned features, builds queued directives, stress-tests via Chaos Monkey, and self-heals bugs."
      />

      {/* Enable toggle */}
      <ToggleSwitch
        label="Enable Dream Mode"
        description="When enabled, the Dream tab becomes available for autonomous maintenance cycles."
        enabled={dream.enabled}
        onChange={(value) => updateDreamSettings({ enabled: value })}
      />

      {dream.enabled && (
        <>
          {/* Repository URL */}
          <TextInput
            label="Repository"
            description="GitHub repository in owner/repo format (e.g. facebook/react)"
            value={dream.repoUrl}
            onChange={(value) => updateDreamSettings({ repoUrl: value })}
            placeholder="owner/repo"
          />

          {/* GitHub Token */}
          <TextInput
            label="GitHub Token"
            description="Personal Access Token for private repositories. Leave empty for public repos."
            value={dream.githubToken}
            onChange={(value) => updateDreamSettings({ githubToken: value })}
            placeholder="ghp_..."
            type="password"
          />

          {/* Chaos Profile */}
          <Select
            label="Testing Intensity"
            description="Controls how aggressively the Chaos Monkey stress-tests your app."
            value={dream.chaosProfile}
            onChange={(value) => updateDreamSettings({ chaosProfile: value as ChaosProfileName })}
            options={CHAOS_PROFILE_NAMES.map((name) => ({
              value: name,
              label: `${CHAOS_PROFILE_META[name].label} — ${CHAOS_PROFILE_META[name].description} (${CHAOS_PROFILE_META[name].costEstimate})`,
            }))}
          />

          {/* Auto-commit (not yet implemented) */}
          <ToggleSwitch
            label="Auto-commit patches (coming soon)"
            description="Automatically commit bug fixes and completed features back to the repository. This feature is not yet implemented — patches are logged but not committed."
            enabled={dream.autoCommit}
            onChange={(value) => updateDreamSettings({ autoCommit: value })}
          />

          {/* Link to Dream page */}
          <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
            <p className="text-sm text-blue-300">
              Dream Mode is configured. Open the{' '}
              <a
                href="/app/dream"
                className="font-medium text-blue-400 underline hover:text-blue-300"
              >
                Dream Room
              </a>{' '}
              to start an autonomous maintenance cycle.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

export default DreamToggle;
