import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from '@/types/export';
import {
  generateMarkdownContent,
  sanitizeFileName,
  formatFileSize,
} from '../utils/markdownExporter';

interface ExportPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionName: string;
  messages: Message[];
  onConfirm: () => void;
}

export function ExportPreviewModal({
  open,
  onOpenChange,
  sessionName,
  messages,
  onConfirm,
}: ExportPreviewModalProps) {
  const [markdown, setMarkdown] = useState<string>('');

  useEffect(() => {
    if (open && sessionName && messages.length > 0) {
      const content = generateMarkdownContent(sessionName, messages);
      setMarkdown(content);
    }
  }, [open, sessionName, messages]);

  const fileName = `${sanitizeFileName(sessionName)}_export.md`;
  const fileSize = formatFileSize(new Blob([markdown], { type: 'text/markdown' }).size);
  const messageCount = messages.length;

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>导出预览</DialogTitle>
          <DialogDescription>
            查看导出内容并确认是否下载
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Export Statistics */}
          <Card className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-sm text-muted-foreground">文件名</div>
                <div className="font-medium truncate" title={fileName}>
                  {fileName}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">文件大小</div>
                <div className="font-medium">{fileSize}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">消息数量</div>
                <div className="font-medium">{messageCount}</div>
              </div>
            </div>
          </Card>

          {/* Markdown Preview */}
          <Card className="p-4">
            <div className="text-sm font-medium text-muted-foreground mb-3">
              Markdown 预览
            </div>
            <ScrollArea className="h-[400px] w-full rounded-md border p-4">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {markdown}
                </ReactMarkdown>
              </div>
            </ScrollArea>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleConfirm}>
            确认导出
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
