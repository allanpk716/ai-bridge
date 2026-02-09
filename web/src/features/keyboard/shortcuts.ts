/**
 * Keyboard Shortcuts Configuration
 *
 * Defines all keyboard shortcuts with platform-aware formatting.
 * Detects Mac vs Windows/Linux to display correct modifier keys (⌘ vs Ctrl).
 *
 * @see .planning/phases/06-polish-advanced-features/06-03-PLAN.md
 */

/**
 * Shortcut interface
 */
export interface Shortcut {
  /** Key combination e.g., 'ctrl+k', 'ctrl+/', 'escape' */
  keyCombo: string;

  /** Human-readable name */
  name: string;

  /** Description of what the shortcut does */
  description: string;

  /** Scope: 'global' works everywhere, 'local' only in inputs */
  scope: 'global' | 'local';

  /** Action to execute when shortcut is triggered */
  action: () => void;

  /** Group name for display in help modal */
  group?: string;

  /** Category for filtering/grouping */
  category?: 'navigation' | 'editing' | 'chat' | 'system';
}

/**
 * Platform detection
 * Mac uses ⌘ symbol, Windows/Linux use Ctrl
 */
const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

/**
 * Format key combo for display
 * Converts 'ctrl+k' to '⌘K' on Mac or 'Ctrl + K' on Windows/Linux
 *
 * @param keyCombo - Key combination string (e.g., 'ctrl+k')
 * @returns Formatted display string
 *
 * @example
 * ```ts
 * formatKeyCombo('ctrl+k')     // Mac: '⌘K', Windows: 'Ctrl + K'
 * formatKeyCombo('ctrl+shift+n') // Mac: '⌘⇧N', Windows: 'Ctrl + Shift + N'
 * formatKeyCombo('escape')     // 'ESCAPE'
 * ```
 */
export function formatKeyCombo(keyCombo: string): string {
  return keyCombo
    .replace('ctrl', isMac ? '⌘' : 'Ctrl')
    .replace('meta', '⌘')
    .replace('shift', '⇧')
    .replace('alt', isMac ? '⌥' : 'Alt')
    .replace('+', isMac ? '' : ' + ')
    .toUpperCase();
}

/**
 * Global shortcuts registry
 * These will be registered in ShortcutProvider
 *
 * Note: Actions are placeholders here - they'll be replaced when registered
 */
export const globalShortcuts: Omit<Shortcut, 'action'>[] = [
  // Navigation
  {
    keyCombo: 'ctrl+k',
    name: '打开命令面板',
    description: '快速访问所有命令和操作',
    scope: 'global',
    group: '导航',
    category: 'navigation'
  },
  {
    keyCombo: 'ctrl+shift+n',
    name: '新建会话',
    description: '创建新的Claude会话',
    scope: 'global',
    group: '会话',
    category: 'navigation'
  },

  // Chat
  {
    keyCombo: 'ctrl+enter',
    name: '发送消息',
    description: '在聊天输入框中发送消息',
    scope: 'local',
    group: '聊天',
    category: 'chat'
  },

  // System
  {
    keyCombo: 'ctrl+/',
    name: '快捷键帮助',
    description: '显示所有可用的键盘快捷键',
    scope: 'global',
    group: '帮助',
    category: 'system'
  },
];

/**
 * Get platform-specific modifier key name
 * @returns '⌘' on Mac, 'Ctrl' on Windows/Linux
 */
export function getModifierKey(): string {
  return isMac ? '⌘' : 'Ctrl';
}
