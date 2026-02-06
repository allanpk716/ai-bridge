import type { ReactNode } from 'react';
import { MessageSquare } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

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
 * - Fixed width (w-80, 320px)
 * - Border on right side
 * - Background and text colors from theme variables
 * - Hidden on mobile, visible on desktop (md+)
 */
export function Sidebar({ children }: SidebarProps) {
  return (
    <aside className="hidden md:flex md:w-80 md:flex-col md:fixed md:inset-y-0 border-r bg-background">
      {/* Header */}
      <div className="flex h-16 items-center px-6 border-b">
        <MessageSquare className="h-6 w-6 text-primary" />
        <h1 className="ml-3 text-lg font-semibold">AI-Bridge</h1>
      </div>

      {/* Session List Area (placeholder) */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="text-sm text-muted-foreground text-center py-8">
          Session list will appear here
        </div>
        {children}
      </div>

      {/* Footer with Theme Toggle */}
      <div className="p-4 border-t">
        <div className="flex items-center justify-center">
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
