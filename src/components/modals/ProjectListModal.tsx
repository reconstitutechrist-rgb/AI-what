'use client';

/**
 * ProjectListModal
 *
 * Full-screen modal showing all saved projects.
 * Users can load, delete, or create new projects.
 * Reads from useProjectStore and orchestrates via useProjectManager.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useProjectStore } from '@/store/useProjectStore';
import { useProjectManager } from '@/hooks/useProjectManager';
import {
  FolderIcon,
  PlusIcon,
  TrashIcon,
  ClockIcon,
  SearchIcon,
  XIcon,
  LoaderIcon,
} from '@/components/ui/Icons';

// ============================================================================
// HELPERS
// ============================================================================

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

const statusColors: Record<string, string> = {
  planning: 'bg-blue-500/20 text-blue-400',
  designing: 'bg-purple-500/20 text-purple-400',
  building: 'bg-amber-500/20 text-amber-400',
  complete: 'bg-emerald-500/20 text-emerald-400',
};

// ============================================================================
// COMPONENT
// ============================================================================

export function ProjectListModal() {
  const router = useRouter();
  const showProjectList = useProjectStore((s) => s.showProjectList);
  const setShowProjectList = useProjectStore((s) => s.setShowProjectList);
  const projectList = useProjectStore((s) => s.projectList);
  const isLoading = useProjectStore((s) => s.isLoading);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const refreshProjectList = useProjectStore((s) => s.refreshProjectList);

  const { loadProject, deleteProject, startNewProject } = useProjectManager();

  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Load project list from IndexedDB when modal opens
  useEffect(() => {
    if (showProjectList) {
      refreshProjectList();
    }
  }, [showProjectList, refreshProjectList]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowProjectList(false);
    };
    if (showProjectList) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [showProjectList, setShowProjectList]);

  // Filter projects by search
  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projectList;
    const q = searchQuery.toLowerCase();
    return projectList.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }, [projectList, searchQuery]);

  const handleLoad = useCallback(
    async (projectId: string) => {
      await loadProject(projectId);
      setShowProjectList(false);
      router.push('/app/design');
    },
    [loadProject, setShowProjectList, router]
  );

  const handleDelete = useCallback(
    async (projectId: string) => {
      await deleteProject(projectId);
      setConfirmDeleteId(null);
    },
    [deleteProject]
  );

  const handleNewProject = useCallback(async () => {
    await startNewProject();
    setShowProjectList(false);
    router.push('/app/design');
  }, [startNewProject, setShowProjectList, router]);

  return (
    <AnimatePresence>
      {showProjectList && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={() => setShowProjectList(false)}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowProjectList(false)}
          >
            <div
              className="w-full max-w-2xl max-h-[80vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden"
              style={{
                background: 'var(--bg-secondary, #1a1a2e)',
                borderColor: 'var(--border-color, #2a2a4a)',
              }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between p-5 border-b"
                style={{ borderColor: 'var(--border-color)' }}
              >
                <div className="flex items-center gap-3">
                  <FolderIcon size={20} className="text-garden-400" />
                  <h2
                    className="text-lg font-semibold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    My Projects
                  </h2>
                  {projectList.length > 0 && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: 'var(--hover-bg)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {projectList.length}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleNewProject}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-garden-600 to-garden-500 hover:from-garden-500 hover:to-garden-400 rounded-lg transition-all shadow-lg shadow-garden-500/20"
                  >
                    <PlusIcon size={14} />
                    New Project
                  </button>
                  <button
                    onClick={() => setShowProjectList(false)}
                    className="p-2 rounded-lg transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = 'var(--hover-bg)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = 'transparent')
                    }
                  >
                    <XIcon size={18} />
                  </button>
                </div>
              </div>

              {/* Search */}
              {projectList.length > 0 && (
                <div className="px-5 pt-4">
                  <div
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border"
                    style={{
                      background: 'var(--bg-primary)',
                      borderColor: 'var(--border-color)',
                    }}
                  >
                    <SearchIcon size={16} style={{ color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search projects..."
                      className="flex-1 bg-transparent text-sm outline-none"
                      style={{ color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>
              )}

              {/* Project List */}
              <div className="flex-1 overflow-y-auto p-5 space-y-2">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <LoaderIcon size={24} className="animate-spin text-garden-400" />
                    <p
                      className="mt-3 text-sm"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Loading projects...
                    </p>
                  </div>
                ) : filteredProjects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <FolderIcon
                      size={48}
                      className="mb-4"
                      style={{ color: 'var(--text-muted)', opacity: 0.3 }}
                    />
                    <p
                      className="text-sm font-medium"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {searchQuery ? 'No matching projects' : 'No saved projects yet'}
                    </p>
                    <p
                      className="text-xs mt-1"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {searchQuery
                        ? 'Try a different search term'
                        : 'Your projects will appear here when you save them'}
                    </p>
                  </div>
                ) : (
                  filteredProjects.map((project) => (
                    <motion.div
                      key={project.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`group flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                        project.id === activeProjectId
                          ? 'border-garden-500/40 bg-garden-500/5'
                          : ''
                      }`}
                      style={{
                        borderColor:
                          project.id === activeProjectId
                            ? undefined
                            : 'var(--border-color)',
                      }}
                      onClick={() => handleLoad(project.id)}
                      onMouseEnter={(e) => {
                        if (project.id !== activeProjectId) {
                          e.currentTarget.style.background = 'var(--hover-bg)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (project.id !== activeProjectId) {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      {/* Thumbnail or placeholder */}
                      <div
                        className="w-12 h-12 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center"
                        style={{
                          background: project.thumbnailUrl
                            ? undefined
                            : 'linear-gradient(135deg, var(--garden-600, #059669) 0%, var(--gold-500, #eab308) 100%)',
                        }}
                      >
                        {project.thumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={project.thumbnailUrl}
                            alt={project.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <FolderIcon size={20} className="text-white/80" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-sm font-medium truncate"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {project.name}
                          </span>
                          {project.id === activeProjectId && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-garden-500/20 text-garden-400 font-medium">
                              Active
                            </span>
                          )}
                        </div>
                        <div
                          className="flex items-center gap-3 mt-1"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          <span className="flex items-center gap-1 text-xs">
                            <ClockIcon size={12} />
                            {timeAgo(project.updatedAt)}
                          </span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                              statusColors[project.buildStatus] || statusColors.planning
                            }`}
                          >
                            {project.buildStatus}
                          </span>
                        </div>
                        {project.description && (
                          <p
                            className="text-xs mt-1 truncate"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {project.description}
                          </p>
                        )}
                      </div>

                      {/* Delete button */}
                      <div
                        className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {confirmDeleteId === project.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(project.id)}
                              className="px-2 py-1 text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded transition-colors"
                            >
                              Delete
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1 text-xs rounded transition-colors"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(project.id)}
                            className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                            style={{ color: 'var(--text-muted)' }}
                            title="Delete project"
                          >
                            <TrashIcon size={14} />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default ProjectListModal;
