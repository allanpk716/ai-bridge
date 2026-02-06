import { useState } from 'react';
import { Outlet } from 'react-router';
import { useSwipeable } from 'react-swipeable';
import TopNav from '@/components/TopNav';
import { Sidebar } from '@/components/Sidebar';
import { MobileDrawer } from '@/components/MobileDrawer';

/**
 * MainLayout component
 *
 * Responsive master-detail layout with:
 * - Desktop: Fixed sidebar (320px) on left
 * - Mobile: Drawer overlay with swipe gestures
 *
 * Features:
 * - Drawer state management (open/close)
 * - TopNav with hamburger menu control
 * - Left edge swipe to open drawer (mobile only)
 * - Main content area with proper margins
 * - z-index layering for proper stacking
 */
export default function MainLayout() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleMenuClick = () => {
    setIsDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
  };

  // Left edge swipe handlers to open drawer (mobile only)
  const edgeSwipeHandlers = useSwipeable({
    onSwipedRight: (eventData) => {
      // Only open if swipe started from left edge (within 30px)
      if (eventData.initial && eventData.event instanceof MouseEvent && eventData.initial[0] <= 30) {
        if (!isDrawerOpen) {
          setIsDrawerOpen(true);
        }
      } else if (eventData.event instanceof TouchEvent) {
        // For touch events, check if touch started near left edge
        const touch = eventData.event.changedTouches[0];
        if (touch && touch.clientX <= 30 && !isDrawerOpen) {
          setIsDrawerOpen(true);
        }
      }
    },
    trackMouse: true,
    trackTouch: true,
    preventScrollOnSwipe: false,
  });

  return (
    <>
      {/* Desktop Sidebar (fixed, hidden on mobile) */}
      <Sidebar />

      {/* Mobile Drawer (overlay, hidden on desktop) */}
      <MobileDrawer isOpen={isDrawerOpen} onClose={handleDrawerClose} />

      {/* Main content wrapper with edge swipe detection */}
      <div {...edgeSwipeHandlers} className="flex h-screen flex-col md:pl-80">
        <TopNav onMenuClick={handleMenuClick} />
        <main className="flex-1 overflow-auto p-4 md:p-6 pt-20 md:pt-6">
          <Outlet />
        </main>
      </div>
    </>
  );
}
