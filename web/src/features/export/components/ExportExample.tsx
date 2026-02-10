/**
 * ExportExample - 演示如何集成导出功能
 *
 * 这个组件展示了如何在会话详情页面中使用导出功能
 *
 * 集成步骤:
 * 1. 导入 ExportButton, ExportPreviewModal, 和 useExportMutation
 * 2. 管理模态框的 open 状态
 * 3. 从 API 获取会话数据 (session, messages)
 * 4. 点击导出时打开预览模态框
 * 5. 用户确认后调用 mutation
 * 6. 成功后显示 toast
 */

import { useState } from 'react';
import { ExportButton } from './ExportButton';
import { ExportPreviewModal } from './ExportPreviewModal';
import { useExportMutation } from '../hooks/useExportMutation';
import type { Message } from '@/types/export';

interface ExportExampleProps {
  sessionId: string;
  sessionName: string;
  messages: Message[];
}

export function ExportExample({
  sessionId,
  sessionName,
  messages,
}: ExportExampleProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const exportMutation = useExportMutation();

  const handleExportClick = () => {
    setIsPreviewOpen(true);
  };

  const handleConfirmExport = () => {
    exportMutation.mutate(
      {
        sessionId,
        sessionName,
        messages,
      },
      {
        onSuccess: () => {
          // 导出成功后的额外处理
          console.log('Export completed successfully');
        },
      }
    );
  };

  return (
    <>
      {/* 在会话详情页的操作栏添加导出按钮 */}
      <ExportButton
        onExportMarkdown={handleExportClick}
        disabled={messages.length === 0 || exportMutation.isPending}
      />

      {/* 导出预览模态框 */}
      <ExportPreviewModal
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        sessionName={sessionName}
        messages={messages}
        onConfirm={handleConfirmExport}
      />
    </>
  );
}

/**
 * 使用示例:
 *
 * ```tsx
 * import { useSession } from '@/features/sessions/hooks/useSession';
 * import { useChatMessages } from '@/features/chat/hooks/useChatMessages';
 * import { ExportExample } from '@/features/export/components/ExportExample';
 *
 * function SessionDetail({ sessionId }: { sessionId: string }) {
 *   const { data: session, isLoading } = useSession(sessionId);
 *   const { messages } = useChatMessages(sessionId);
 *
 *   if (isLoading) return <div>加载中...</div>;
 *
 *   return (
 *     <div>
 *       <div className="flex justify-between items-center">
 *         <h1>{session?.name}</h1>
 *         <ExportExample
 *           sessionId={session?.id}
 *           sessionName={session?.name}
 *           messages={messages}
 *         />
 *       </div>
 *
 *       {/* 其他会话详情内容 *\/}
 *     </div>
 *   );
 * }
 * ```
 */
