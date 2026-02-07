/**
 * Connection Status Indicator Component
 *
 * Displays current backend connection status as a colored dot with tooltip.
 * Used in TopNav (desktop) and Sidebar (mobile).
 *
 * Status states:
 * - online: Green dot - Connected to backend
 * - offline: Gray dot - Not connected
 * - reconnecting: Yellow pulsing dot - Attempting to reconnect
 * - error: Red dot - Connection failed
 *
 * Visual design:
 * - 12px dot (w-3 h-3) with rounded-full
 * - Tooltip shows detailed status on hover
 * - Reconnecting status has animate-pulse for visual attention
 * - Text label alongside dot for accessibility
 */

import { useConnectionStore } from '@/lib/stores/connection';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/**
 * Status configuration mapping
 * Each status has color, label, and description
 */
const statusConfig = {
  online: {
    color: 'bg-green-500',
    label: 'Online',
    description: 'Connected to backend',
  },
  offline: {
    color: 'bg-gray-500',
    label: 'Offline',
    description: 'Not connected',
  },
  reconnecting: {
    color: 'bg-yellow-500 animate-pulse',
    label: 'Reconnecting',
    description: 'Attempting to reconnect...',
  },
  error: {
    color: 'bg-red-500',
    label: 'Error',
    description: 'Connection failed',
  },
} as const;

/**
 * Connection status indicator component
 *
 * Shows colored dot + text label with tooltip on hover.
 * Subscribes to Zustand store for automatic updates.
 *
 * @example
 * <ConnectionStatusIndicator />
 */
export function ConnectionStatusIndicator() {
  const status = useConnectionStore((state) => state.status);
  const config = statusConfig[status];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 cursor-help">
            {/* Status dot - 12px with rounded-full */}
            <div className={`w-3 h-3 rounded-full ${config.color}`} aria-hidden="true" />
            {/* Text label - visible on desktop */}
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {config.label}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
