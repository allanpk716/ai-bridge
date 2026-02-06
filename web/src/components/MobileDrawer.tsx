import { useSwipeable } from 'react-swipeable';
import { X } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Button } from './ui/button';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * MobileDrawer component
 *
 * Overlay drawer for mobile devices with:
 * - Swipe left gesture to close
 * - Click overlay to close
 * - Smooth slide animation (300ms)
 * - Contains Sidebar component
 *
 * Features:
 * - Fixed position from left edge
 * - Width: 280px (mobile optimized)
 * - z-index: 50 (above main content)
 * - Hidden on desktop (md:hidden)
 */
export function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  // Configure swipe handlers for drawer
  const handlers = useSwipeable({
    onSwipedLeft: () => {
      // Close drawer when swiping left
      if (isOpen) {
        onClose();
      }
    },
    trackMouse: true, // Enable mouse swipe for desktop testing
    preventScrollOnSwipe: false, // Allow page scroll while swiping
  });

  // Don't render if closed (unless you want exit animation)
  if (!isOpen) {
    return null;
  }

  return (
    <div className="md:hidden">
      {/* Overlay/Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div
        {...handlers}
        className="fixed inset-y-0 left-0 w-[280px] z-50 shadow-lg transform transition-transform duration-300 ease-in-out border-r border-border"
        style={{
          backgroundColor: 'hsl(var(--card))',
        }}
      >
        {/* Close Button */}
        <div className="absolute top-4 right-4 z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="md:hidden"
            aria-label="Close drawer"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Sidebar Content */}
        <div className="h-full flex flex-col">
          <Sidebar />
        </div>
      </div>
    </div>
  );
}
