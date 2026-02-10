import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { exportSessionToMarkdown, sanitizeFileName } from '../utils/markdownExporter';
import { addExportEntry } from '../utils/exportHistory';
import { Message } from '@/types/export';

interface ExportVariables {
  sessionId: string;
  sessionName: string;
  messages: Message[];
}

export function useExportMutation() {
  return useMutation<string, Error, ExportVariables>({
    mutationFn: async ({ sessionId, sessionName, messages }: ExportVariables) => {
      return exportSessionToMarkdown(sessionName, messages);
    },
    onSuccess: (markdown, variables) => {
      toast.success(`已导出: ${variables.sessionName}`);

      // Add to export history
      const fileName = sanitizeFileName(variables.sessionName);
      addExportEntry({
        sessionId: variables.sessionId,
        fileName,
        exportTime: new Date().toISOString(),
        messageCount: variables.messages.length,
      });
    },
    onError: (error) => {
      toast.error('导出失败,请重试');
      console.error('Export error:', error);
    },
  });
}
