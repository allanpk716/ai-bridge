/**
 * Export functionality types
 */

export interface Message {
  id: string;
  sessionId: string;
  content: string;
  role: 'user' | 'assistant';
  createdAt: string;
  seq?: number;
  metadata?: Record<string, unknown>;
}

export interface ExportPreviewData {
  sessionName: string;
  messages: Message[];
  fileName: string;
  fileSize: string;
  messageCount: number;
}

export interface ExportHistoryEntry {
  sessionId: string;
  fileName: string;
  exportTime: string;
  messageCount: number;
}
