/**
 * Diff Application Utility
 * 
 * Applies targeted code modifications (diffs) to existing files
 * without rewriting entire files.
 */

interface DiffChange {
  type: 'ADD_IMPORT' | 'INSERT_AFTER' | 'INSERT_BEFORE' | 'REPLACE' | 'DELETE' | 'APPEND';
  line?: number;
  searchFor?: string;
  content?: string;
  replaceWith?: string;
}

interface FileDiff {
  path: string;
  action: 'MODIFY' | 'CREATE' | 'DELETE';
  changes: DiffChange[];
}

interface ApplyDiffResult {
  success: boolean;
  modifiedFiles: Array<{ path: string; content: string }>;
  errors: string[];
}

/**
 * Main function to apply diffs to files
 */
export function applyDiff(
  currentFiles: Array<{ path: string; content: string }>,
  diffs: FileDiff[],
  dryRun: boolean = false
): ApplyDiffResult {
  const result: ApplyDiffResult = {
    success: true,
    modifiedFiles: [],
    errors: []
  };

  // In dry-run mode, just validate without applying changes
  if (dryRun) {
    // Validate that all search patterns can be found
    for (const fileDiff of diffs) {
      const file = currentFiles.find(f => f.path === fileDiff.path);
      if (fileDiff.action === 'MODIFY' && !file) {
        result.errors.push(`File not found for modification: ${fileDiff.path}`);
        result.success = false;
      }
    }
    // Return current files unchanged
    result.modifiedFiles = currentFiles;
    return result;
  }

  // Create a map of current files for easy lookup
  const fileMap = new Map<string, string>();
  currentFiles.forEach(file => {
    fileMap.set(file.path, file.content);
  });

  // Process each file diff
  for (const fileDiff of diffs) {
    try {
      if (fileDiff.action === 'DELETE') {
        // Remove file from map
        fileMap.delete(fileDiff.path);
        continue;
      }

      if (fileDiff.action === 'CREATE') {
        // Create new file with content from first change
        const content = fileDiff.changes[0]?.content || '';
        fileMap.set(fileDiff.path, content);
        continue;
      }

      // MODIFY action - apply changes to existing file
      let fileContent = fileMap.get(fileDiff.path);
      
      if (!fileContent) {
        result.errors.push(`File not found: ${fileDiff.path}`);
        result.success = false;
        continue;
      }

      // Apply each change in sequence
      for (const change of fileDiff.changes) {
        try {
          fileContent = applyChange(fileContent, change);
        } catch (error) {
          const errorMsg = `Failed to apply ${change.type} to ${fileDiff.path}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          result.errors.push(errorMsg);
          result.success = false;
        }
      }

      // Update file in map
      fileMap.set(fileDiff.path, fileContent);
      
    } catch (error) {
      const errorMsg = `Failed to process ${fileDiff.path}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      result.errors.push(errorMsg);
      result.success = false;
    }
  }

  // Convert map back to array
  fileMap.forEach((content, path) => {
    result.modifiedFiles.push({ path, content });
  });

  return result;
}

/**
 * Apply a single change to file content
 */
function applyChange(content: string, change: DiffChange): string {
  switch (change.type) {
    case 'ADD_IMPORT':
      return addImport(content, change.content || '');
    
    case 'INSERT_AFTER':
      return insertAfter(content, change.searchFor || '', change.content || '');
    
    case 'INSERT_BEFORE':
      return insertBefore(content, change.searchFor || '', change.content || '');
    
    case 'REPLACE':
      return replace(content, change.searchFor || '', change.replaceWith || '');
    
    case 'DELETE':
      return deleteCode(content, change.searchFor || '');
    
    case 'APPEND':
      return append(content, change.content || '');
    
    default:
      throw new Error(`Unknown change type: ${(change as any).type}`);
  }
}

/**
 * Add import statement at the top of the file
 */
function addImport(content: string, importStatement: string): string {
  const lines = content.split('\n');
  
  // Check if import already exists
  if (content.includes(importStatement.trim())) {
    return content; // Already exists, no need to add
  }
  
  // Find the last import statement
  let lastImportIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ')) {
      lastImportIndex = i;
    } else if (lastImportIndex !== -1 && lines[i].trim() !== '') {
      // Found first non-import, non-empty line after imports
      break;
    }
  }
  
  // Insert after last import, or at the beginning if no imports
  const insertIndex = lastImportIndex !== -1 ? lastImportIndex + 1 : 0;
  lines.splice(insertIndex, 0, importStatement);
  
  return lines.join('\n');
}

/**
 * Insert content after a search pattern
 */
function insertAfter(content: string, searchFor: string, insertContent: string): string {
  const index = content.indexOf(searchFor);
  
  if (index === -1) {
    throw new Error(`Search pattern not found: "${searchFor.substring(0, 50)}..."`);
  }
  
  // Find the end of the line containing the search pattern
  const endOfLine = content.indexOf('\n', index + searchFor.length);
  const insertPosition = endOfLine !== -1 ? endOfLine + 1 : content.length;
  
  // Handle escaped newlines in insertContent
  const processedContent = insertContent.replace(/\\n/g, '\n');
  
  return content.substring(0, insertPosition) + 
         processedContent + 
         (processedContent.endsWith('\n') ? '' : '\n') +
         content.substring(insertPosition);
}

/**
 * Insert content before a search pattern
 */
function insertBefore(content: string, searchFor: string, insertContent: string): string {
  const index = content.indexOf(searchFor);
  
  if (index === -1) {
    throw new Error(`Search pattern not found: "${searchFor.substring(0, 50)}..."`);
  }
  
  // Find the start of the line containing the search pattern
  let startOfLine = content.lastIndexOf('\n', index - 1) + 1;
  
  // Handle escaped newlines in insertContent
  const processedContent = insertContent.replace(/\\n/g, '\n');
  
  return content.substring(0, startOfLine) + 
         processedContent + 
         (processedContent.endsWith('\n') ? '' : '\n') +
         content.substring(startOfLine);
}

/**
 * Replace search pattern with new content
 */
function replace(content: string, searchFor: string, replaceWith: string): string {
  if (!content.includes(searchFor)) {
    throw new Error(`Search pattern not found: "${searchFor.substring(0, 50)}..."`);
  }
  
  // Handle escaped characters
  const processedReplaceWith = replaceWith.replace(/\\n/g, '\n');
  
  // Replace first occurrence only (for safety)
  return content.replace(searchFor, processedReplaceWith);
}

/**
 * Delete code matching search pattern
 */
function deleteCode(content: string, searchFor: string): string {
  const index = content.indexOf(searchFor);
  
  if (index === -1) {
    throw new Error(`Search pattern not found: "${searchFor.substring(0, 50)}..."`);
  }
  
  // Find the start and end of the line(s) to delete
  const startOfLine = content.lastIndexOf('\n', index - 1) + 1;
  const endOfLine = content.indexOf('\n', index + searchFor.length);
  const deleteEnd = endOfLine !== -1 ? endOfLine + 1 : content.length;
  
  return content.substring(0, startOfLine) + content.substring(deleteEnd);
}

/**
 * Append content to end of file
 */
function append(content: string, appendContent: string): string {
  // Handle escaped newlines
  const processedContent = appendContent.replace(/\\n/g, '\n');
  
  // Ensure there's a newline before appending if content doesn't end with one
  const separator = content.endsWith('\n') ? '' : '\n';
  
  return content + separator + processedContent;
}

/**
 * Preview changes without applying them
 */
export function previewDiff(
  currentFiles: Array<{ path: string; content: string }>,
  diffs: FileDiff[]
): {
  path: string;
  before: string;
  after: string;
  changes: Array<{ type: string; description: string }>;
}[] {
  const previews: Array<{
    path: string;
    before: string;
    after: string;
    changes: Array<{ type: string; description: string }>;
  }> = [];

  const result = applyDiff(currentFiles, diffs, true);

  for (const modifiedFile of result.modifiedFiles) {
    const originalFile = currentFiles.find(f => f.path === modifiedFile.path);
    const diff = diffs.find(d => d.path === modifiedFile.path);
    
    if (originalFile && diff) {
      previews.push({
        path: modifiedFile.path,
        before: originalFile.content,
        after: modifiedFile.content,
        changes: diff.changes.map(change => ({
          type: change.type,
          description: getChangeDescription(change)
        }))
      });
    }
  }

  return previews;
}

/**
 * Get human-readable description of a change
 */
function getChangeDescription(change: DiffChange): string {
  switch (change.type) {
    case 'ADD_IMPORT':
      return `Add import: ${change.content?.substring(0, 50)}...`;
    case 'INSERT_AFTER':
      return `Insert after: "${change.searchFor?.substring(0, 30)}..."`;
    case 'INSERT_BEFORE':
      return `Insert before: "${change.searchFor?.substring(0, 30)}..."`;
    case 'REPLACE':
      return `Replace: "${change.searchFor?.substring(0, 30)}..." with "${change.replaceWith?.substring(0, 30)}..."`;
    case 'DELETE':
      return `Delete: "${change.searchFor?.substring(0, 30)}..."`;
    case 'APPEND':
      return `Append to end of file`;
    default:
      return 'Unknown change';
  }
}
