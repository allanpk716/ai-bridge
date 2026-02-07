import type { ReactNode } from 'react';
import { MessageSquare } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { ConnectionStatusIndicator } from './connection/StatusIndicator';

interface SidebarProps {
  children?: ReactNode;
}

/**
 * Sidebar component
 *
 * Full-height sidebar with:
 * - Header with app name/logo
 * - Session list area (placeholder for now)
 * - Footer with theme toggle
 *
 * Features:
 * - Fixed width (w-80, 320px) on desktop
 * - Full width (w-full) in mobile drawer
 * - Border on right side (desktop only, handled by parent)
 * - Background and text colors from theme variables
 * - Works in both desktop fixed and mobile drawer contexts
 */
export function Sidebar({ children }: SidebarProps) {
  return (
    <div className="w-full md:w-80 flex flex-col h-full bg-background border-r">
      {/* Header */}
      <div className="flex h-16 items-center px-6 border-b flex-shrink-0">
        <MessageSquare className="h-6 w-6 text-primary flex-shrink-0" />
        <h1 className="ml-3 text-lg font-semibold truncate">AI-Bridge</h1>
      </div>

      {/* Session List Area (placeholder) */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="text-sm text-muted-foreground text-center py-8">
          Session list will appear here
        </div>
        {children}
      </div>

      {/* Footer with Theme Toggle and Connection Status */}
      <div className="p-4 border-t">
        <div className="flex items-center justify-between">
          <ConnectionStatusIndicator />
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
