/**
 * ShortcutSheet Component
 *
 * Displays all keyboard shortcuts grouped by category with search.
 * Used within ShortcutHelpModal for the main content area.
 *
 * @see .planning/phases/06-polish-advanced-features/06-03-PLAN.md
 */

import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatKeyCombo, type Shortcut } from '../shortcuts';

interface ShortcutSheetProps {
  /** Array of shortcuts to display */
  shortcuts: Shortcut[];
}

/**
 * ShortcutSheet Component
 *
 * Displays keyboard shortcuts in groups with search functionality.
 *
 * @example
 * ```tsx
 * <ShortcutSheet shortcuts={globalShortcuts} />
 * ```
 */
export function ShortcutSheet({ shortcuts }: ShortcutSheetProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Group shortcuts by group name
  const groupedShortcuts = useMemo(() => {
    const filtered = shortcuts.filter(shortcut =>
      shortcut.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shortcut.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shortcut.keyCombo.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return filtered.reduce((acc, shortcut) => {
      const group = shortcut.group || 'Other';
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(shortcut);
      return acc;
    }, {} as Record<string, Shortcut[]>);
  }, [shortcuts, searchQuery]);

  // Get icon for category
  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'navigation':
        return '📍';
      case 'chat':
        return '💬';
      case 'editing':
        return '✏️';
      case 'system':
        return '🎯';
      default:
        return '⌨️';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="搜索快捷键..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Shortcuts list */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {Object.keys(groupedShortcuts).length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              没有找到匹配的快捷键
            </div>
          ) : (
            Object.entries(groupedShortcuts).map(([group, groupShortcuts]) => (
              <div key={group} className="mb-6 last:mb-0">
                {/* Group header */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">
                    {getCategoryIcon(groupShortcuts[0]?.category)}
                  </span>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    {group}
                  </h3>
                </div>

                {/* Shortcuts in this group */}
                <div className="space-y-2">
                  {groupShortcuts.map((shortcut) => (
                    <div
                      key={shortcut.keyCombo}
                      className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-accent transition-colors"
                    >
                      {/* Description */}
                      <div className="flex-1">
                        <div className="text-sm font-medium">{shortcut.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {shortcut.description}
                        </div>
                      </div>

                      {/* Key combo */}
                      <kbd className="ml-4 px-2 py-1 text-xs font-semibold rounded bg-muted border border-border">
                        {formatKeyCombo(shortcut.keyCombo)}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
