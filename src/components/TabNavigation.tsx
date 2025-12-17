'use client';

import React from 'react';
import { useAppStore, type MainView } from '@/store/useAppStore';
import { FileIcon } from './ui/Icons';

interface TabConfig {
  id: MainView;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const tabs: TabConfig[] = [
  {
    id: 'main',
    label: 'Builder',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    ),
    description: 'Chat & Preview',
  },
  {
    id: 'wizard',
    label: 'Wizard',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
        />
      </svg>
    ),
    description: 'Plan your app',
  },
  {
    id: 'layout',
    label: 'Layout',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
        />
      </svg>
    ),
    description: 'Design layouts',
  },
  {
    id: 'build',
    label: 'Build',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
        />
      </svg>
    ),
    description: 'Phased building',
  },
];

export function TabNavigation() {
  const activeView = useAppStore((state) => state.activeView);
  const setActiveView = useAppStore((state) => state.setActiveView);
  const showDocumentationPanel = useAppStore((state) => state.showDocumentationPanel);
  const setShowDocumentationPanel = useAppStore((state) => state.setShowDocumentationPanel);
  const currentDocumentation = useAppStore((state) => state.currentDocumentation);

  return (
    <nav className="flex items-center gap-1 px-4 py-2 bg-zinc-900 border-b border-zinc-800">
      {/* Main navigation tabs */}
      {tabs.map((tab) => {
        const isActive = activeView === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              isActive
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
            title={tab.description}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        );
      })}

      {/* Spacer to push Project Docs to far right */}
      <div className="flex-1" />

      {/* Project Documentation button */}
      <button
        onClick={() => setShowDocumentationPanel(!showDocumentationPanel)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          showDocumentationPanel
            ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
        }`}
        title="View project documentation"
      >
        <FileIcon size={16} />
        <span>Project Docs</span>
        {currentDocumentation && (
          <span className="w-2 h-2 rounded-full bg-green-400" title="Documentation available" />
        )}
      </button>
    </nav>
  );
}

export default TabNavigation;
