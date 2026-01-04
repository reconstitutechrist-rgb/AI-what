'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { ChevronRightIcon, ChevronDownIcon, FolderIcon } from './Icons';
import { buildFileTree, getFileIcon, type FileTreeNode } from '@/utils/fileTreeUtils';

interface FileTreeProps {
  /** Array of file objects with path property */
  files: { path: string; content: string; description?: string }[];
  /** Currently selected file path */
  selectedPath: string | null;
  /** Callback when a file is selected */
  onSelectFile: (path: string) => void;
  /** Optional className for the container */
  className?: string;
  /** Initial expanded depth - defaults to 2 */
  defaultExpandedDepth?: number;
}

interface FileTreeNodeProps {
  node: FileTreeNode;
  selectedPath: string | null;
  expandedFolders: Set<string>;
  onToggleFolder: (path: string) => void;
  onSelectFile: (path: string) => void;
}

/**
 * Renders a single node (file or folder) in the tree
 */
function FileTreeNodeComponent({
  node,
  selectedPath,
  expandedFolders,
  onToggleFolder,
  onSelectFile,
}: FileTreeNodeProps) {
  const isExpanded = expandedFolders.has(node.path);
  const isSelected = node.path === selectedPath;
  const indentPx = node.depth * 12;

  if (node.type === 'folder') {
    return (
      <div>
        <button
          onClick={() => onToggleFolder(node.path)}
          className="w-full flex items-center gap-1.5 px-2 py-1 text-sm hover:bg-white/5 transition-colors rounded text-slate-300 hover:text-white"
          style={{ paddingLeft: `${8 + indentPx}px` }}
        >
          {isExpanded ? (
            <ChevronDownIcon size={12} className="text-slate-500 flex-shrink-0" />
          ) : (
            <ChevronRightIcon size={12} className="text-slate-500 flex-shrink-0" />
          )}
          <FolderIcon
            size={14}
            className={`flex-shrink-0 ${isExpanded ? 'text-garden-400' : 'text-slate-400'}`}
          />
          <span className="truncate">{node.name}</span>
        </button>

        {isExpanded && node.children && (
          <div>
            {node.children.map((child) => (
              <FileTreeNodeComponent
                key={child.path}
                node={child}
                selectedPath={selectedPath}
                expandedFolders={expandedFolders}
                onToggleFolder={onToggleFolder}
                onSelectFile={onSelectFile}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // File node
  const icon = getFileIcon(node.path);

  return (
    <button
      onClick={() => onSelectFile(node.path)}
      className={`w-full flex items-center gap-1.5 px-2 py-1 text-sm transition-colors rounded ${
        isSelected
          ? 'bg-garden-600/20 text-garden-300 border-l-2 border-garden-500'
          : 'text-slate-300 hover:bg-white/5 hover:text-white border-l-2 border-transparent'
      }`}
      style={{ paddingLeft: `${8 + indentPx + 16}px` }}
    >
      <span className="text-xs flex-shrink-0">{icon}</span>
      <span className="truncate">{node.name}</span>
    </button>
  );
}

/**
 * FileTree Component
 *
 * Displays a hierarchical file tree with collapsible folders.
 */
export function FileTree({
  files,
  selectedPath,
  onSelectFile,
  className = '',
  defaultExpandedDepth = 2,
}: FileTreeProps) {
  // Build tree structure from flat files
  const tree = useMemo(() => buildFileTree(files), [files]);

  // Initialize expanded folders (expand first N levels by default)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(() => {
    const expanded = new Set<string>();

    const addExpanded = (nodes: FileTreeNode[]) => {
      for (const node of nodes) {
        if (node.type === 'folder' && node.depth < defaultExpandedDepth) {
          expanded.add(node.path);
          if (node.children) {
            addExpanded(node.children);
          }
        }
      }
    };

    addExpanded(tree.roots);
    return expanded;
  });

  const handleToggleFolder = useCallback((path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  // Auto-expand folders when a file is selected that's in a collapsed folder
  const handleSelectFile = useCallback(
    (path: string) => {
      const parts = path.split('/');
      const parentPaths: string[] = [];
      for (let i = 0; i < parts.length - 1; i++) {
        parentPaths.push(parts.slice(0, i + 1).join('/'));
      }

      setExpandedFolders((prev) => {
        const next = new Set(prev);
        parentPaths.forEach((p) => next.add(p));
        return next;
      });

      onSelectFile(path);
    },
    [onSelectFile]
  );

  return (
    <div className={`overflow-y-auto ${className}`}>
      {tree.roots.map((node) => (
        <FileTreeNodeComponent
          key={node.path}
          node={node}
          selectedPath={selectedPath}
          expandedFolders={expandedFolders}
          onToggleFolder={handleToggleFolder}
          onSelectFile={handleSelectFile}
        />
      ))}
    </div>
  );
}

export default FileTree;
