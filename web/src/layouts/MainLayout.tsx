import { useState } from 'react';
import { Outlet } from 'react-router';
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

  return (
    <>
      {/* Desktop Sidebar (fixed, hidden on mobile) */}
      <div className="hidden md:flex md:w-80 md:flex-col md:fixed md:inset-y-0 md:border-r md:bg-background">
        <Sidebar />
      </div>

      {/* Mobile Drawer (overlay, hidden on desktop) */}
      <MobileDrawer isOpen={isDrawerOpen} onClose={handleDrawerClose} />

      {/* Main content wrapper */}
      <div className="flex h-screen flex-col md:pl-80">
        <TopNav onMenuClick={handleMenuClick} />
        <main className="flex-1 overflow-auto p-4 md:p-6 pt-20 md:pt-6">
          <Outlet />
        </main>
      </div>
    </>
  );
}
