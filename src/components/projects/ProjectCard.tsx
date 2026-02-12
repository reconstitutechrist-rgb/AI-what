import React from 'react';
import { ProjectListItem } from '@/types/project';

import { Trash2, FolderOpen, Clock } from 'lucide-react';

interface ProjectCardProps {
  project: ProjectListItem;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  isActive?: boolean;
}

export function ProjectCard({ project, onOpen, onDelete, isActive }: ProjectCardProps) {
  // Simple formatter if date-fns is not available
  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return 'Unknown date';
    }
  };

  return (
    <div 
      className={`group relative flex flex-col rounded-xl border transition-all duration-200 hover:shadow-md
        ${isActive 
          ? 'border-blue-500/50 bg-blue-50/5 dark:border-blue-400/50 dark:bg-blue-900/20' 
          : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'
        }`}
    >
      {/* Thumbnail Area */}
      <div 
        className="relative aspect-video w-full overflow-hidden rounded-t-xl bg-slate-100 dark:bg-slate-950"
        onClick={() => onOpen(project.id)}
      >
        {project.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img 
            src={project.thumbnailUrl} 
            alt={project.name} 
            className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-300 dark:text-slate-700">
            <FolderOpen className="h-12 w-12 opacity-20" />
          </div>
        )}
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/10 dark:group-hover:bg-black/20" />
      
        {isActive && (
          <div className="absolute right-2 top-2 rounded-full bg-blue-500 px-2 py-0.5 text-xs font-medium text-white shadow-sm">
            Active
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 flex items-start justify-between">
          <h3 className="line-clamp-1 font-semibold text-slate-900 dark:text-slate-100" title={project.name}>
            {project.name}
          </h3>
        </div>
        
        <p className="mb-4 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
          {project.description || 'No description provided'}
        </p>

        <div className="mt-auto flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{formatDate(project.updatedAt)}</span>
          </div>
          
          <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
             <button
              onClick={() => onDelete(project.id)}
              className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
              title="Delete Project"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => onOpen(project.id)}
              className="rounded bg-slate-900 px-3 py-1.5 font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              Open
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
