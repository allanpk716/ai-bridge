import { Menu } from 'lucide-react';
import { Button } from './ui/button';
import { useScrollDirection } from '../hooks/useScrollDirection';

interface TopNavProps {
  onMenuClick?: () => void;
}

/**
 * TopNav component
 *
 * Responsive navigation bar with:
 * - Mobile: Hamburger menu (left) + Auto-hide on scroll
 * - Desktop: Logo (left) + Breadcrumb (center) + Status (right)
 *
 * Features:
 * - Auto-hides when scrolling down on mobile (max-md:)
 * - Shows when scrolling up
 * - Uses transform for smooth animation
 * - Hamburger menu visible only on mobile (md:hidden)
 */
export default function TopNav({ onMenuClick }: TopNavProps) {
  const scrollDirection = useScrollDirection();

  // Auto-hide on scroll down (mobile only)
  const shouldHide = scrollDirection === 'down';

  return (
    <header
      className={`border-b bg-background shadow-sm transition-transform duration-300 ease-in-out fixed top-0 left-0 right-0 z-30 ${
        shouldHide ? '-translate-y-full' : 'translate-y-0'
      }`}
    >
      <div className="flex h-16 items-center justify-between pl-4 pr-4 md:pl-6 md:ml-80">`
        {/* Left: Hamburger (mobile) / Logo (desktop) */}
        <div className="flex items-center">
          {/* Hamburger menu - mobile only */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="md:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </Button>

          {/* Logo - mobile only (desktop shows logo in sidebar) */}
          <h1 className="md:hidden text-xl font-bold">AI-Bridge</h1>
        </div>

        {/* Center: Breadcrumb - desktop only */}
        <div className="flex-1 px-8 hidden md:block">
          <div className="text-sm text-muted-foreground">Navigation</div>
        </div>

        {/* Right: Connection status placeholder */}
        <div className="flex items-center">
          <div className="h-2 w-2 rounded-full bg-gray-300" />
          <span className="ml-2 text-sm text-muted-foreground">Disconnected</span>
        </div>
      </div>
    </header>
  );
}
