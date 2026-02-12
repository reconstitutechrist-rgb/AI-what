import React from 'react';
import { ProjectListItem } from '@/types/project';
import { ProjectCard } from './ProjectCard';
import { Plus } from 'lucide-react';

interface ProjectListProps {
  projects: ProjectListItem[];
  currentProjectId: string | null;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  loading?: boolean;
}

export function ProjectList({ projects, currentProjectId, onOpen, onDelete, onNew, loading }: ProjectListProps) {
  if (loading && projects.length === 0) {
    return (
      <div className="flex h-64 w-full items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-500"></div>
          <p>Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {/* New Project Card */}
      <button
        onClick={onNew}
        className="group flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-6 transition-all hover:border-blue-400 hover:bg-blue-50/10 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900/20 dark:hover:border-blue-500/50 dark:hover:bg-blue-900/10"
      >
        <div className="mb-3 rounded-full bg-slate-100 p-4 transition-transform group-hover:scale-110 dark:bg-slate-800">
          <Plus className="h-6 w-6 text-slate-400 group-hover:text-blue-500 dark:text-slate-500" />
        </div>
        <h3 className="font-semibold text-slate-700 group-hover:text-blue-600 dark:text-slate-300 dark:group-hover:text-blue-400">
          Create New Project
        </h3>
        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
          Start a fresh app from scratch
        </p>
      </button>

      {/* Existing Projects */}
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onOpen={onOpen}
          onDelete={onDelete}
          isActive={project.id === currentProjectId}
        />
      ))}
    </div>
  );
}
