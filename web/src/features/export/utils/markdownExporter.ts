import type { Message } from '@/types/export';

export function exportSessionToMarkdown(
  sessionName: string,
  messages: Message[]
): string {
  // 1. 构建Markdown内容
  let markdown = `# ${sessionName}\n\n`;
  markdown += `*导出时间: ${new Date().toLocaleString('zh-CN')}*\n\n---\n\n`;

  messages.forEach((msg) => {
    const role = msg.role === 'user' ? '👤 用户' : '🤖 Claude';
    const timestamp = new Date(msg.createdAt).toLocaleString('zh-CN');

    markdown += `## ${role}\n\n`;
    markdown += `${msg.content}\n\n`;
    markdown += `*时间: ${timestamp}*\n\n`;
    markdown += `---\n\n`;
  });

  // 2. 创建Blob并触发下载
  const blob = new Blob([markdown], {
    type: 'text/markdown;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;

  // 清理文件名:移除特殊字符,替换为下划线
  const safeFileName = sessionName
    .replace(/[^a-z0-9\u4e00-\u9fa5]/gi, '_')
    .replace(/_+/g, '_')
    .substring(0, 100);

  link.download = `${safeFileName}_export.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return markdown; // 返回用于预览
}

export function generateMarkdownContent(
  sessionName: string,
  messages: Message[]
): string {
  // 生成Markdown内容但不触发下载(用于预览)
  let markdown = `# ${sessionName}\n\n`;
  markdown += `*导出时间: ${new Date().toLocaleString('zh-CN')}*\n\n---\n\n`;

  messages.forEach((msg) => {
    const role = msg.role === 'user' ? '👤 用户' : '🤖 Claude';
    const timestamp = new Date(msg.createdAt).toLocaleString('zh-CN');

    markdown += `## ${role}\n\n`;
    markdown += `${msg.content}\n\n`;
    markdown += `*时间: ${timestamp}*\n\n`;
    markdown += `---\n\n`;
  });

  return markdown;
}

export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-z0-9\u4e00-\u9fa5]/gi, '_')
    .replace(/_+/g, '_')
    .substring(0, 100);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
