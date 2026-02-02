/**
 * ProjectDatabase Service
 *
 * IndexedDB wrapper for project CRUD operations using the `idb` library.
 * Provides unlimited storage capacity compared to localStorage's 5-10MB limit.
 *
 * Database: ai-app-builder-projects
 * Object Store: projects (keyed by id, indexed on updatedAt)
 */

import { openDB, type IDBPDatabase } from 'idb';
import type { SavedProject, ProjectListItem } from '@/types/project';

const DB_NAME = 'ai-app-builder-projects';
const DB_VERSION = 1;
const STORE_NAME = 'projects';

// Singleton DB instance
let dbPromise: Promise<IDBPDatabase> | null = null;

/**
 * Get or create the IndexedDB database instance.
 * Uses a singleton pattern to avoid opening multiple connections.
 */
function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('by-updated', 'updatedAt');
        }
      },
    });
  }
  return dbPromise;
}

/**
 * Save or update a project in IndexedDB.
 * Uses `put` which inserts or overwrites by key.
 */
export async function saveProject(project: SavedProject): Promise<void> {
  const db = await getDB();
  await db.put(STORE_NAME, project);
}

/**
 * Load a full project by ID.
 * Returns null if not found.
 */
export async function loadProject(id: string): Promise<SavedProject | null> {
  const db = await getDB();
  const project = await db.get(STORE_NAME, id);
  return (project as SavedProject) ?? null;
}

/**
 * List all projects as lightweight ProjectListItems.
 * Returns sorted by updatedAt descending (most recent first).
 * Only extracts the fields needed for rendering the project list.
 */
export async function listProjects(): Promise<ProjectListItem[]> {
  const db = await getDB();
  const all = await db.getAll(STORE_NAME);

  return (all as SavedProject[])
    .map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      updatedAt: p.updatedAt,
      buildStatus: p.buildStatus,
      thumbnailUrl: p.layoutThumbnail?.dataUrl ?? null,
    }))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

/**
 * Delete a project by ID.
 */
export async function deleteProject(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}

/**
 * Get the total number of saved projects.
 */
export async function getProjectCount(): Promise<number> {
  const db = await getDB();
  return db.count(STORE_NAME);
}
