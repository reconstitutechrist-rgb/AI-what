/**
 * WebContainer Service
 *
 * Singleton service that boots a WebContainer (in-browser Node.js runtime)
 * and validates generated code by installing dependencies and running a build.
 *
 * Requirements:
 *   - Cross-Origin-Embedder-Policy: credentialless (or require-corp)
 *   - Cross-Origin-Opener-Policy: same-origin
 *   These headers enable SharedArrayBuffer which WebContainers need.
 *   Configured in next.config.js.
 *
 * Usage:
 *   const service = getWebContainerService();
 *   const result = await service.validate(files);
 *   if (!result.valid) { // handle errors }
 */

import { WebContainer } from '@webcontainer/api';
import type { AppFile } from '@/types/railway';
import type {
  ValidationResult,
  SandboxError,
  ExecutionResult,
  WebContainerStatus,
} from '@/types/sandbox';
import { extractDependencies } from '@/utils/extractDependencies';

// ============================================================================
// CONFIGURATION
// ============================================================================

/** Max time to wait for container boot (ms) */
const BOOT_TIMEOUT = 15_000;

/** Max time to wait for npm install (ms) */
const INSTALL_TIMEOUT = 30_000;

/** Max time to wait for build (ms) */
const BUILD_TIMEOUT = 20_000;

// ============================================================================
// PACKAGE.JSON TEMPLATE
// ============================================================================

function buildPackageJson(dependencies: Record<string, string>): string {
  return JSON.stringify(
    {
      name: 'sandbox-validator',
      private: true,
      version: '0.0.0',
      type: 'module',
      dependencies: {
        react: '^19.0.0',
        'react-dom': '^19.0.0',
        ...dependencies,
      },
      devDependencies: {
        '@types/react': '^19.0.0',
        '@types/react-dom': '^19.0.0',
        typescript: '^5.6.0',
        esbuild: '^0.24.0',
      },
    },
    null,
    2
  );
}

// ============================================================================
// TSCONFIG TEMPLATE
// ============================================================================

const TSCONFIG = JSON.stringify(
  {
    compilerOptions: {
      target: 'ES2020',
      module: 'ESNext',
      moduleResolution: 'bundler',
      jsx: 'react-jsx',
      strict: false,
      skipLibCheck: true,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      forceConsistentCasingInFileNames: true,
      resolveJsonModule: true,
      isolatedModules: true,
      noEmit: true,
      paths: {
        '@/*': ['./src/*'],
      },
    },
    include: ['src/**/*'],
  },
  null,
  2
);

// ============================================================================
// SERVICE
// ============================================================================

class WebContainerServiceInstance {
  private container: WebContainer | null = null;
  private bootPromise: Promise<WebContainer> | null = null;
  private _status: WebContainerStatus = 'idle';

  get status(): WebContainerStatus {
    return this._status;
  }

  /**
   * Check if the environment supports WebContainers.
   * Requires cross-origin isolation (SharedArrayBuffer).
   */
  isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return typeof SharedArrayBuffer !== 'undefined';
  }

  /**
   * Boot the WebContainer (lazy, cached).
   * First call takes ~2-3s, subsequent calls return the cached instance.
   */
  async boot(): Promise<WebContainer> {
    if (this.container) return this.container;

    // Deduplicate concurrent boot requests
    if (this.bootPromise) return this.bootPromise;

    if (!this.isSupported()) {
      throw new Error(
        'WebContainers require cross-origin isolation (SharedArrayBuffer). ' +
          'Ensure COOP/COEP headers are configured in next.config.js.'
      );
    }

    this._status = 'booting';

    this.bootPromise = Promise.race([
      WebContainer.boot(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('WebContainer boot timed out')), BOOT_TIMEOUT)
      ),
    ]).then((instance) => {
      this.container = instance;
      this._status = 'ready';
      console.log('[WebContainerService] Container booted successfully');
      return instance;
    }).catch((err) => {
      this._status = 'error';
      this.bootPromise = null;
      throw err;
    });

    return this.bootPromise;
  }

  /**
   * Validate generated code files by:
   * 1. Writing files to the WebContainer filesystem
   * 2. Installing dependencies
   * 3. Running esbuild to check for syntax/import errors
   */
  async validate(files: AppFile[]): Promise<ValidationResult> {
    const startTime = Date.now();

    // If not supported, return a pass-through result
    if (!this.isSupported()) {
      console.warn('[WebContainerService] Not supported, skipping validation');
      return {
        valid: true,
        errors: [],
        warnings: ['WebContainer validation unavailable (no cross-origin isolation)'],
        duration: 0,
      };
    }

    try {
      const container = await this.boot();

      // 1. Extract dependencies from generated code
      const deps = extractDependencies(files);

      // 2. Write project files to the container
      this._status = 'validating';
      await this.writeProjectFiles(container, files, deps);

      // 3. Install dependencies
      this._status = 'installing';
      const installResult = await this.runCommand(
        container,
        'npm',
        ['install', '--no-audit', '--no-fund', '--prefer-offline'],
        INSTALL_TIMEOUT
      );

      if (installResult.exitCode !== 0) {
        const installErrors = this.parseInstallErrors(installResult.stderr);
        return {
          valid: false,
          errors: installErrors,
          warnings: [],
          duration: Date.now() - startTime,
        };
      }

      // 4. Run esbuild syntax check on all .tsx/.ts files
      this._status = 'building';
      const buildResult = await this.runBuildCheck(container, files);

      this._status = 'ready';
      return {
        ...buildResult,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      this._status = 'error';
      const message = error instanceof Error ? error.message : 'Validation failed';
      console.error('[WebContainerService] Validation error:', error);
      return {
        valid: false,
        errors: [{ type: 'unknown', message, raw: String(error) }],
        warnings: [],
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Write all project files to the WebContainer filesystem.
   */
  private async writeProjectFiles(
    container: WebContainer,
    files: AppFile[],
    dependencies: Record<string, string>
  ): Promise<void> {
    // Write package.json
    await container.fs.writeFile('/package.json', buildPackageJson(dependencies));

    // Write tsconfig.json
    await container.fs.writeFile('/tsconfig.json', TSCONFIG);

    // Ensure /src directory exists
    await container.fs.mkdir('/src', { recursive: true });

    // Write each generated file
    for (const file of files) {
      // Ensure parent directory exists
      const dir = file.path.substring(0, file.path.lastIndexOf('/'));
      if (dir && dir !== '/') {
        await container.fs.mkdir(dir, { recursive: true });
      }
      await container.fs.writeFile(file.path, file.content);
    }
  }

  /**
   * Run esbuild to check for syntax and import errors.
   */
  private async runBuildCheck(
    container: WebContainer,
    files: AppFile[]
  ): Promise<Omit<ValidationResult, 'duration'>> {
    // Find the main entry file
    const entryFile =
      files.find((f) => f.path === '/src/App.tsx' || f.path === '/App.tsx')?.path ||
      files[0]?.path;

    if (!entryFile) {
      return { valid: false, errors: [{ type: 'unknown', message: 'No files to validate' }], warnings: [] };
    }

    // Use npx esbuild to bundle-check (no output, just validates)
    const result = await this.runCommand(
      container,
      'npx',
      [
        'esbuild',
        entryFile,
        '--bundle',
        '--format=esm',
        '--jsx=automatic',
        '--platform=browser',
        '--target=es2020',
        '--outfile=/dev/null',
        '--external:react',
        '--external:react-dom',
        '--external:react/jsx-runtime',
      ],
      BUILD_TIMEOUT
    );

    if (result.exitCode === 0) {
      return { valid: true, errors: [], warnings: [] };
    }

    // Parse esbuild error output
    const errors = this.parseEsbuildErrors(result.stderr);
    return { valid: false, errors, warnings: [] };
  }

  /**
   * Run a shell command in the WebContainer and capture output.
   */
  private async runCommand(
    container: WebContainer,
    command: string,
    args: string[],
    timeout: number
  ): Promise<ExecutionResult> {
    const process = await container.spawn(command, args);

    let stdout = '';
    let stderr = '';

    process.output.pipeTo(
      new WritableStream({
        write(chunk) {
          stdout += chunk;
        },
      })
    ).catch(() => { /* ignore pipe errors on timeout */ });

    // WebContainer stderr is combined with stdout in many cases,
    // but we capture separately when available
    if ('stderr' in process && process.stderr) {
      (process.stderr as ReadableStream<string>).pipeTo(
        new WritableStream({
          write(chunk) {
            stderr += chunk;
          },
        })
      ).catch(() => { /* ignore pipe errors on timeout */ });
    }

    const exitCode = await Promise.race([
      process.exit,
      new Promise<number>((resolve) =>
        setTimeout(() => {
          process.kill();
          resolve(124); // timeout exit code
        }, timeout)
      ),
    ]);

    // If stderr is empty, errors might be in stdout (common with esbuild)
    if (!stderr && exitCode !== 0) {
      stderr = stdout;
    }

    return { exitCode, stdout, stderr };
  }

  /**
   * Parse esbuild error output into structured SandboxError objects.
   */
  private parseEsbuildErrors(output: string): SandboxError[] {
    const errors: SandboxError[] = [];
    // esbuild error format: "X error: message" or "file:line:col: error: message"
    const errorRegex = /(?:([^\s:]+):(\d+):(\d+):\s*)?error:\s*(.+)/g;
    let match: RegExpExecArray | null;

    while ((match = errorRegex.exec(output)) !== null) {
      const [, file, line, column, message] = match;

      // Determine error type from message
      let type: SandboxError['type'] = 'unknown';
      if (message.includes('Could not resolve')) type = 'import';
      else if (message.includes('Expected') || message.includes('Unexpected')) type = 'syntax';
      else if (message.includes('is not defined')) type = 'runtime';
      else type = 'build';

      errors.push({
        type,
        message: message.trim(),
        file: file || undefined,
        line: line ? parseInt(line, 10) : undefined,
        column: column ? parseInt(column, 10) : undefined,
        raw: match[0],
      });
    }

    // Fallback: if no structured errors found, treat entire output as one error
    if (errors.length === 0 && output.trim()) {
      errors.push({
        type: 'build',
        message: output.trim().slice(0, 500),
        raw: output,
      });
    }

    return errors;
  }

  /**
   * Parse npm install errors into structured SandboxError objects.
   */
  private parseInstallErrors(output: string): SandboxError[] {
    const errors: SandboxError[] = [];
    // npm error format: "npm error ..." or "npm ERR! ..."
    const lines = output.split('\n');

    for (const line of lines) {
      if (line.includes('ERR!') || line.includes('error')) {
        const message = line.replace(/npm\s+(ERR!|error)\s*/i, '').trim();
        if (message) {
          // Check if it's a missing package
          const type: SandboxError['type'] = message.includes('404') || message.includes('not found')
            ? 'import'
            : 'build';
          errors.push({ type, message, raw: line });
        }
      }
    }

    if (errors.length === 0 && output.trim()) {
      errors.push({
        type: 'build',
        message: `npm install failed: ${output.trim().slice(0, 300)}`,
        raw: output,
      });
    }

    return errors;
  }

  /**
   * Tear down the WebContainer instance.
   * Called when no longer needed (e.g., unmounting the app).
   */
  async teardown(): Promise<void> {
    if (this.container) {
      this.container.teardown();
      this.container = null;
      this.bootPromise = null;
      this._status = 'idle';
      console.log('[WebContainerService] Container torn down');
    }
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let _instance: WebContainerServiceInstance | null = null;

export function getWebContainerService(): WebContainerServiceInstance {
  if (!_instance) {
    _instance = new WebContainerServiceInstance();
  }
  return _instance;
}

export type { WebContainerServiceInstance };
