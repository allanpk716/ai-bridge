import { ExportHistoryEntry } from '@/types/export';

const EXPORT_HISTORY_KEY = 'ai-bridge-export-history';
const MAX_HISTORY_ENTRIES = 20;

/**
 * Load export history from localStorage
 */
export function loadExportHistory(): ExportHistoryEntry[] {
  try {
    const stored = localStorage.getItem(EXPORT_HISTORY_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as ExportHistoryEntry[];
  } catch (error) {
    console.error('Failed to load export history:', error);
    return [];
  }
}

/**
 * Save export history to localStorage
 */
export function saveExportHistory(history: ExportHistoryEntry[]): void {
  try {
    localStorage.setItem(EXPORT_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Failed to save export history:', error);
  }
}

/**
 * Add a new export entry to history
 */
export function addExportEntry(entry: ExportHistoryEntry): void {
  const history = loadExportHistory();

  // Remove duplicate entries for the same session
  const filtered = history.filter((h) => h.sessionId !== entry.sessionId);

  // Add new entry at the beginning
  const updated = [entry, ...filtered];

  // Limit to max entries
  const limited = updated.slice(0, MAX_HISTORY_ENTRIES);

  saveExportHistory(limited);
}

/**
 * Clear all export history
 */
export function clearExportHistory(): void {
  try {
    localStorage.removeItem(EXPORT_HISTORY_KEY);
  } catch (error) {
    console.error('Failed to clear export history:', error);
  }
}

/**
 * Remove a specific export entry from history
 */
export function removeExportEntry(sessionId: string): void {
  const history = loadExportHistory();
  const filtered = history.filter((h) => h.sessionId !== sessionId);
  saveExportHistory(filtered);
}

/**
 * Get recent exports (limit to 5)
 */
export function getRecentExports(): ExportHistoryEntry[] {
  const history = loadExportHistory();
  return history.slice(0, 5);
}

/**
 * Check if a session was recently exported
 */
export function wasRecentlyExported(sessionId: string): boolean {
  const history = loadExportHistory();
  return history.some((h) => h.sessionId === sessionId);
}
