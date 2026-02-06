/**
 * Repo Loader Service
 *
 * Downloads a GitHub repository as a ZIP archive via the GitHub API,
 * extracts it in memory using JSZip, and converts it to a WebContainer
 * FileSystemTree for mounting.
 *
 * This bypasses the need for git clone (which WebContainers don't support)
 * by using the "Zip-Mount Protocol": GitHub API → ZIP → JSZip → FileSystemTree.
 *
 * Server/client agnostic — works in both browser and Node.js contexts.
 */

import JSZip from 'jszip';
import type { FileSystemTree, DirectoryNode, FileNode } from '@webcontainer/api';
import type { AppFile } from '@/types/railway';
import type { RepoContext } from '@/types/titanPipeline';
import { getRepoAnalyst } from '@/services/titanPipeline';

// ============================================================================
// CONFIGURATION
// ============================================================================

/** Files/directories to skip when extracting */
const SKIP_PATTERNS = [
  'node_modules',
  '.git',
  '.next',
  '.turbo',
  'dist',
  'build',
  '.DS_Store',
  'Thumbs.db',
  '.env',
  '.env.local',
  '.env.production',
];

/** Maximum file size to extract (5MB) — skip large binaries */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/** File extensions to treat as binary (skip content extraction) */
const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.webp', '.avif',
  '.woff', '.woff2', '.ttf', '.eot', '.otf',
  '.mp3', '.mp4', '.webm', '.ogg', '.wav',
  '.zip', '.tar', '.gz', '.br',
  '.pdf', '.doc', '.docx',
  '.exe', '.dll', '.so', '.dylib',
]);

// ============================================================================
// SERVICE
// ============================================================================

class RepoLoaderServiceInstance {
  /**
   * Download a GitHub repository and convert it to a WebContainer FileSystemTree.
   *
   * @param repoUrl - Repository in "owner/repo" format (e.g., "vercel/next.js")
   * @param token - GitHub Personal Access Token (required for private repos)
   * @param branch - Branch to download (default: main)
   * @returns FileSystemTree ready to mount in WebContainer
   */
  async loadRepo(
    repoUrl: string,
    token?: string,
    branch: string = 'main'
  ): Promise<FileSystemTree> {
    console.log(`[RepoLoader] Fetching repo: ${repoUrl} (branch: ${branch})`);

    // 1. Fetch the ZIP archive via GitHub API
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(
      `https://api.github.com/repos/${repoUrl}/zipball/${branch}`,
      { headers }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(
        `Failed to fetch repo ${repoUrl}: ${response.status} ${response.statusText}. ${errorText}`
      );
    }

    // 2. Unzip in memory
    const blob = await response.blob();
    const zip = await JSZip.loadAsync(blob);

    console.log('[RepoLoader] Unzipping and building file tree...');

    // 3. Convert ZIP entries to FileSystemTree
    const tree: FileSystemTree = {};
    let fileCount = 0;
    let skippedCount = 0;

    for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
      // Skip directories (we create them implicitly)
      if (zipEntry.dir) continue;

      // GitHub ZIPs have a root folder wrapper: "owner-repo-sha/"
      // Strip it to get the actual repo file paths
      const cleanPath = relativePath.split('/').slice(1).join('/');
      if (!cleanPath) continue;

      // Skip files matching skip patterns
      if (this.shouldSkip(cleanPath)) {
        skippedCount++;
        continue;
      }

      // Skip binary files
      const ext = this.getExtension(cleanPath);
      if (BINARY_EXTENSIONS.has(ext)) {
        skippedCount++;
        continue;
      }

      try {
        // Check uncompressed size before extraction to avoid OOM on large files.
        // JSZip's _data.uncompressedSize is undocumented but reliable.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const uncompressedSize = (zipEntry as any)._data?.uncompressedSize;
        if (typeof uncompressedSize === 'number' && uncompressedSize > MAX_FILE_SIZE) {
          console.warn(`[RepoLoader] Skipping large file (pre-check): ${cleanPath} (${uncompressedSize} bytes)`);
          skippedCount++;
          continue;
        }

        const content = await zipEntry.async('string');
        // Fallback size check for when _data wasn't available
        if (content.length > MAX_FILE_SIZE) {
          console.warn(`[RepoLoader] Skipping large file: ${cleanPath} (${content.length} bytes)`);
          skippedCount++;
          continue;
        }
        this.addToTree(tree, cleanPath, content);
        fileCount++;
      } catch {
        // Binary file that can't be read as string — skip
        skippedCount++;
      }
    }

    console.log(
      `[RepoLoader] Extracted ${fileCount} files (skipped ${skippedCount})`
    );

    return tree;
  }

  /**
   * Convert a FileSystemTree back to AppFile[] for use with existing services.
   * Flattens the tree into a list of files with paths.
   */
  treeToAppFiles(tree: FileSystemTree, prefix: string = ''): AppFile[] {
    const files: AppFile[] = [];

    for (const [name, node] of Object.entries(tree)) {
      const path = prefix ? `${prefix}/${name}` : name;

      if ('file' in node) {
        const fileNode = node as FileNode;
        const content = typeof fileNode.file.contents === 'string'
          ? fileNode.file.contents
          : new TextDecoder().decode(fileNode.file.contents as Uint8Array);
        files.push({ path: `/${path}`, content });
      } else if ('directory' in node) {
        const dirNode = node as DirectoryNode;
        files.push(...this.treeToAppFiles(dirNode.directory, path));
      }
    }

    return files;
  }

  // ==========================================================================
  // EAGER ANALYSIS (Ultimate Developer Mode)
  // ==========================================================================

  /** Cached analysis results by repo URL */
  private analysisCache = new Map<string, RepoContext>();
  /** In-progress analysis promises by repo URL */
  private analysisInProgress = new Map<string, Promise<RepoContext>>();

  /**
   * Load a repo AND trigger background analysis for "Ultimate Developer" mode.
   * Analysis runs in the background and caches the result.
   *
   * @returns FileSystemTree immediately; analysis continues in background
   */
  async loadRepoWithAnalysis(
    repoUrl: string,
    token?: string,
    branch: string = 'main'
  ): Promise<{ tree: FileSystemTree; analysisPromise: Promise<RepoContext> }> {
    // Load the repo first (blocking)
    const tree = await this.loadRepo(repoUrl, token, branch);

    // Start analysis in background (non-blocking)
    const cacheKey = `${repoUrl}@${branch}`;
    const analysisPromise = this.analyzeInBackground(tree, cacheKey);

    return { tree, analysisPromise };
  }

  /**
   * Run analysis in the background and cache the result.
   */
  private async analyzeInBackground(tree: FileSystemTree, cacheKey: string): Promise<RepoContext> {
    // Check cache first
    const cached = this.analysisCache.get(cacheKey);
    if (cached) {
      console.log(`[RepoLoader] Using cached analysis for ${cacheKey}`);
      return cached;
    }

    // Check if analysis is already in progress
    const inProgress = this.analysisInProgress.get(cacheKey);
    if (inProgress) {
      console.log(`[RepoLoader] Analysis already in progress for ${cacheKey}`);
      return inProgress;
    }

    // Start new analysis
    console.log(`[RepoLoader] Starting background analysis for ${cacheKey}...`);
    const analysisPromise = (async () => {
      try {
        const files = this.treeToAppFiles(tree);
        const analyst = getRepoAnalyst();
        const context = await analyst.analyzeRepo(files);

        // Cache the result
        this.analysisCache.set(cacheKey, context);
        console.log(`[RepoLoader] Analysis complete for ${cacheKey}`);

        return context;
      } finally {
        // Clean up in-progress tracker
        this.analysisInProgress.delete(cacheKey);
      }
    })();

    this.analysisInProgress.set(cacheKey, analysisPromise);
    return analysisPromise;
  }

  /**
   * Get cached analysis result if available.
   */
  getCachedAnalysis(repoUrl: string, branch: string = 'main'): RepoContext | undefined {
    return this.analysisCache.get(`${repoUrl}@${branch}`);
  }

  /**
   * Check if analysis is currently running for a repo.
   */
  isAnalyzing(repoUrl: string, branch: string = 'main'): boolean {
    return this.analysisInProgress.has(`${repoUrl}@${branch}`);
  }

  /**
   * Clear cached analysis for a repo (e.g., after changes are pushed).
   */
  invalidateAnalysis(repoUrl: string, branch: string = 'main'): void {
    this.analysisCache.delete(`${repoUrl}@${branch}`);
  }

  /**
   * Check if a file path should be skipped during extraction.
   */
  private shouldSkip(path: string): boolean {
    const parts = path.split('/');
    return parts.some((part) =>
      SKIP_PATTERNS.some((pattern) => {
        if (pattern.startsWith('.')) {
          return part === pattern || part.startsWith(pattern);
        }
        return part === pattern;
      })
    );
  }

  /**
   * Get the file extension (lowercase, with dot).
   */
  private getExtension(path: string): string {
    const lastDot = path.lastIndexOf('.');
    if (lastDot === -1) return '';
    return path.slice(lastDot).toLowerCase();
  }

  /**
   * Add a file to the nested FileSystemTree structure.
   * Converts "src/components/Button.tsx" into:
   * { src: { directory: { components: { directory: { "Button.tsx": { file: { contents: "..." } } } } } } }
   */
  private addToTree(tree: FileSystemTree, path: string, content: string): void {
    const parts = path.split('/');
    let current = tree;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;

      if (isFile) {
        current[part] = {
          file: { contents: content },
        };
      } else {
        if (!current[part]) {
          current[part] = { directory: {} };
        }
        const node = current[part];
        if ('directory' in node) {
          current = (node as DirectoryNode).directory;
        }
      }
    }
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let _instance: RepoLoaderServiceInstance | null = null;

export function getRepoLoaderService(): RepoLoaderServiceInstance {
  if (!_instance) {
    _instance = new RepoLoaderServiceInstance();
  }
  return _instance;
}

export type { RepoLoaderServiceInstance };
