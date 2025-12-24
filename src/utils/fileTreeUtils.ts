/**
 * Utility functions for building hierarchical file trees from flat file paths
 */

export interface FileTreeNode {
  /** Display name (just the filename or folder name) */
  name: string;
  /** Full path from root (e.g., "src/components/Button.tsx") */
  path: string;
  /** Whether this is a folder or file */
  type: 'folder' | 'file';
  /** Child nodes (only for folders) */
  children?: FileTreeNode[];
  /** Depth level in the tree (0 for root items) */
  depth: number;
}

export interface FileTree {
  /** Root-level nodes */
  roots: FileTreeNode[];
}

/**
 * Builds a hierarchical tree structure from flat file paths
 *
 * @param files - Array of objects with `path` property
 * @returns FileTree with roots
 *
 * @example
 * const files = [
 *   { path: 'src/App.tsx', content: '...' },
 *   { path: 'src/components/Button.tsx', content: '...' },
 *   { path: 'package.json', content: '...' }
 * ];
 * const tree = buildFileTree(files);
 * // tree.roots = [
 * //   { name: 'src', type: 'folder', children: [...] },
 * //   { name: 'package.json', type: 'file' }
 * // ]
 */
export function buildFileTree(files: { path: string }[]): FileTree {
  const nodeMap = new Map<string, FileTreeNode>();
  const roots: FileTreeNode[] = [];

  // Sort files for consistent processing
  const sortedPaths = files.map((f) => f.path).sort();

  for (const filePath of sortedPaths) {
    const parts = filePath.split('/');
    let currentPath = '';

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      const parentPath = currentPath;
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      // Skip if node already exists
      if (nodeMap.has(currentPath)) {
        continue;
      }

      const node: FileTreeNode = {
        name: part,
        path: currentPath,
        type: isFile ? 'file' : 'folder',
        depth: i,
        children: isFile ? undefined : [],
      };

      nodeMap.set(currentPath, node);

      // Add to parent or roots
      if (parentPath) {
        const parent = nodeMap.get(parentPath);
        if (parent && parent.children) {
          parent.children.push(node);
        }
      } else {
        roots.push(node);
      }
    }
  }

  // Sort children: folders first, then files, both alphabetically
  const sortChildren = (nodes: FileTreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
    nodes.forEach((node) => {
      if (node.children) {
        sortChildren(node.children);
      }
    });
  };

  sortChildren(roots);

  return { roots };
}

/**
 * Gets the file extension from a path
 */
export function getFileExtension(path: string): string {
  const filename = path.split('/').pop() || '';
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

/**
 * Gets the appropriate emoji icon for a file based on its extension
 */
export function getFileIcon(path: string): string {
  const ext = getFileExtension(path);

  const iconMap: Record<string, string> = {
    // TypeScript/JavaScript
    tsx: '⚛️',
    ts: '📘',
    jsx: '⚛️',
    js: '📒',

    // Styles
    css: '🎨',
    scss: '🎨',
    sass: '🎨',

    // Data/Config
    json: '⚙️',
    yaml: '⚙️',
    yml: '⚙️',
    env: '🔐',
    prisma: '🗄️',

    // Docs
    md: '📝',
    mdx: '📝',

    // Other
    html: '🌐',
    svg: '🖼️',
    png: '🖼️',
    jpg: '🖼️',
  };

  return iconMap[ext] || '📄';
}
