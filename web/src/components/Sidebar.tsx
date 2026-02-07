import type { ReactNode } from 'react';
import { useState } from 'react';
import { MessageSquare, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import { ConnectionStatusIndicator } from './connection/StatusIndicator';
import { CreateSessionDialog } from '@/components/session/CreateSessionDialog';

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
  const [dialogOpen, setDialogOpen] = useState(false);

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

      {/* Footer with Theme Toggle, Connection Status, and New Session */}
      <div className="p-4 border-t space-y-3">
        <Button
          className="w-full justify-start"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Session
        </Button>
        <div className="flex items-center justify-between">
          <ConnectionStatusIndicator />
          <ThemeToggle />
        </div>
      </div>

      {/* Create Session Dialog */}
      <CreateSessionDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
