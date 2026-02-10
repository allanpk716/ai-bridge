# Export to Markdown Feature

会话导出为 Markdown 格式文件的功能模块。

## 功能特性

- ✅ 导出完整会话历史为 Markdown 文件
- ✅ 导出前预览对话框
- ✅ 自动文件下载
- ✅ 文件名清理(移除特殊字符)
- ✅ 导出历史记录
- ✅ 成功/失败提示

## 文件结构

```
src/features/export/
├── components/
│   ├── ExportButton.tsx          # 导出按钮组件(带下拉菜单)
│   ├── ExportPreviewModal.tsx    # 导出预览模态框
│   └── ExportExample.tsx         # 集成示例组件
├── hooks/
│   └── useExportMutation.ts      # 导出 mutation hook
├── utils/
│   ├── markdownExporter.ts       # Markdown 导出工具
│   └── exportHistory.ts          # 导出历史管理
└── index.ts                      # 桶导出
```

## 使用方法

### 基础用法

```tsx
import { ExportExample } from '@/features/export';

function SessionDetail() {
  const session = { id: '123', name: 'My Session' };
  const messages = [
    { id: '1', role: 'user', content: 'Hello', createdAt: '2024-01-01' },
    { id: '2', role: 'assistant', content: 'Hi there!', createdAt: '2024-01-01' },
  ];

  return (
    <ExportExample
      sessionId={session.id}
      sessionName={session.name}
      messages={messages}
    />
  );
}
```

### 高级用法

```tsx
import { useExportMutation } from '@/features/export';
import { ExportButton, ExportPreviewModal } from '@/features/export';

function CustomExport() {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const exportMutation = useExportMutation();

  const handleExport = () => {
    exportMutation.mutate({
      sessionId: '123',
      sessionName: 'My Session',
      messages: myMessages,
    });
  };

  return (
    <>
      <ExportButton onExportMarkdown={() => setIsPreviewOpen(true)} />
      <ExportPreviewModal
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        sessionName="My Session"
        messages={myMessages}
        onConfirm={handleExport}
      />
    </>
  );
}
```

### 导出历史

```tsx
import {
  getRecentExports,
  loadExportHistory,
  clearExportHistory,
} from '@/features/export';

function ExportHistoryList() {
  const recent = getRecentExports(); // 最近 5 次导出
  const all = loadExportHistory();   // 所有历史(最多 20 条)

  return (
    <div>
      <h3>最近导出</h3>
      <ul>
        {recent.map((entry) => (
          <li key={entry.sessionId}>
            {entry.fileName} - {new Date(entry.exportTime).toLocaleString()}
          </li>
        ))}
      </ul>
      <button onClick={clearExportHistory}>清除历史</button>
    </div>
  );
}
```

## API 文档

### Components

#### ExportButton

导出按钮组件,带下拉菜单。

```tsx
interface ExportButtonProps {
  onExportMarkdown?: () => void;
  onExportSelected?: () => void;  // 未来功能
  disabled?: boolean;
}
```

#### ExportPreviewModal

导出预览模态框,显示 Markdown 内容预览。

```tsx
interface ExportPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionName: string;
  messages: Message[];
  onConfirm: () => void;
}
```

#### ExportExample

完整的导出集成示例,展示如何组合使用各个组件。

### Hooks

#### useExportMutation

导出 mutation hook,处理文件下载和 toast 提示。

```tsx
function useExportMutation(): UseMutationResult<
  string,
  Error,
  { sessionId: string; sessionName: string; messages: Message[] }
>
```

### Utils

#### exportSessionToMarkdown

导出会话为 Markdown 文件并触发下载。

```tsx
function exportSessionToMarkdown(
  sessionName: string,
  messages: Message[]
): string
```

#### generateMarkdownContent

生成 Markdown 内容(不触发下载,用于预览)。

```tsx
function generateMarkdownContent(
  sessionName: string,
  messages: Message[]
): string
```

#### sanitizeFileName

清理文件名中的特殊字符。

```tsx
function sanitizeFileName(fileName: string): string
```

#### formatFileSize

格式化文件大小。

```tsx
function formatFileSize(bytes: number): string
```

#### Export History

```tsx
// 加载导出历史
function loadExportHistory(): ExportHistoryEntry[]

// 保存导出历史
function saveExportHistory(history: ExportHistoryEntry[]): void

// 添加导出记录
function addExportEntry(entry: ExportHistoryEntry): void

// 清除所有历史
function clearExportHistory(): void

// 移除指定记录
function removeExportEntry(sessionId: string): void

// 获取最近 5 条
function getRecentExports(): ExportHistoryEntry[]

// 检查是否最近导出过
function wasRecentlyExported(sessionId: string): boolean
```

## Markdown 格式

导出的 Markdown 文件格式:

```markdown
# 会话名称

*导出时间: 2024-01-01 12:00:00*

---

## 👤 用户

用户消息内容

*时间: 2024-01-01 12:00:00*

---

## 🤖 Claude

助手回复内容

*时间: 2024-01-01 12:00:00*

---
```

## 依赖项

- `@tanstack/react-query` - Mutation hooks
- `sonner` - Toast 通知
- `react-markdown` - Markdown 渲染
- `remark-gfm` - GitHub Flavored Markdown
- `lucide-react` - 图标

## 集成状态

- ✅ ExportButton 组件
- ✅ ExportPreviewModal 组件
- ✅ useExportMutation hook
- ✅ 导出历史功能
- ⏳ SessionDetail 集成(待 SessionDetail 组件实现)
- ⏳ ChatMessageList 集成(待 ChatMessageList 组件实现)

## 未来扩展

- [ ] 导出选中的消息
- [ ] 导出为 JSON(包含元数据)
- [ ] 导出为 TXT(纯文本)
- [ ] 导出时间范围选择
- [ ] 导出进度指示(大文件)
- [ ] 导出为 PDF
- [ ] 导出到云服务(Google Drive, Dropbox)
