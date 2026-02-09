import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { exportSessionToMarkdown } from '../utils/markdownExporter';
import { Message } from '@/types/export';

interface ExportVariables {
  sessionName: string;
  messages: Message[];
}

export function useExportMutation() {
  return useMutation<string, Error, ExportVariables>({
    mutationFn: async ({ sessionName, messages }: ExportVariables) => {
      return exportSessionToMarkdown(sessionName, messages);
    },
    onSuccess: (markdown, variables) => {
      toast.success(`已导出: ${variables.sessionName}`);
    },
    onError: (error) => {
      toast.error('导出失败,请重试');
      console.error('Export error:', error);
    },
  });
}
