/**
 * ShortcutHelpModal Component
 *
 * Modal dialog displaying all keyboard shortcuts.
 * Triggered by Ctrl+/ keyboard shortcut or help button.
 *
 * @see .planning/phases/06-polish-advanced-features/06-03-PLAN.md
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ShortcutSheet } from './ShortcutSheet';
import type { Shortcut } from '../shortcuts';

interface ShortcutHelpModalProps {
  /** Controls dialog visibility */
  open: boolean;
  /** Callback when dialog opens/closes */
  onOpenChange: (open: boolean) => void;
  /** Array of shortcuts to display */
  shortcuts: Shortcut[];
}

/**
 * ShortcutHelpModal Component
 *
 * Displays keyboard shortcuts in a modal dialog with search and grouping.
 *
 * @example
 * ```tsx
 * const [open, setOpen] = useState(false);
 * const shortcuts = [...]; // Your shortcuts array
 *
 * <ShortcutHelpModal
 *   open={open}
 *   onOpenChange={setOpen}
 *   shortcuts={shortcuts}
 * />
 * ```
 */
export function ShortcutHelpModal({
  open,
  onOpenChange,
  shortcuts,
}: ShortcutHelpModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">⌨️</span>
            键盘快捷键
          </DialogTitle>
          <DialogDescription>
            按ESC或点击外部区域关闭
          </DialogDescription>
        </DialogHeader>

        {/* Shortcuts list */}
        <ShortcutSheet shortcuts={shortcuts} />
      </DialogContent>
    </Dialog>
  );
}
