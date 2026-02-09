import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download } from 'lucide-react';

interface ExportButtonProps {
  onExportMarkdown?: () => void;
  onExportSelected?: () => void;
  disabled?: boolean;
}

export function ExportButton({
  onExportMarkdown,
  onExportSelected,
  disabled = false,
}: ExportButtonProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          <Download className="h-4 w-4 mr-2" />
          导出
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onExportMarkdown && (
          <DropdownMenuItem onClick={onExportMarkdown}>
            <Download className="h-4 w-4 mr-2" />
            导出为Markdown
          </DropdownMenuItem>
        )}
        {onExportSelected && (
          <DropdownMenuItem onClick={onExportSelected}>
            <Download className="h-4 w-4 mr-2" />
            导出选中的消息
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
