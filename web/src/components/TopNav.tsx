import { Menu, Keyboard, Search } from 'lucide-react';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { useScrollDirection } from '../hooks/useScrollDirection';
import { ConnectionStatusIndicator } from './connection/StatusIndicator';
import { SearchBar } from '@/features/search';

interface TopNavProps {
  onMenuClick?: () => void;
  onShortcutHelpClick?: () => void;
  onSearchChange?: (query: string) => void;
  resultCount?: number;
  isSearching?: boolean;
}

/**
 * TopNav component
 *
 * Responsive navigation bar with:
 * - Mobile: Hamburger menu (left) + Auto-hide on scroll
 * - Desktop: Logo (left) + Breadcrumb (center) + Status + Help (right)
 *
 * Features:
 * - Auto-hides when scrolling down on mobile (max-md:)
 * - Shows when scrolling up
 * - Uses transform for smooth animation
 * - Hamburger menu visible only on mobile (md:hidden)
 * - Keyboard shortcuts help button on desktop
 */
export default function TopNav({
  onMenuClick,
  onShortcutHelpClick,
  onSearchChange,
  resultCount,
  isSearching
}: TopNavProps) {
  const scrollDirection = useScrollDirection();

  // Auto-hide on scroll down (mobile only)
  const shouldHide = scrollDirection === 'down';

  return (
    <header
      role="banner"
      className={`border-b bg-background shadow-sm transition-transform duration-300 ease-in-out fixed top-0 left-0 right-0 z-30 ${
        shouldHide ? '-translate-y-full' : 'translate-y-0'
      }`}
    >
      <nav className="flex h-16 items-center justify-between pl-4 pr-4 md:pl-[336px] md:pr-6" aria-label="主导航">
        {/* Left: Hamburger (mobile) / Logo (desktop) */}
        <div className="flex items-center gap-2">
          {/* Hamburger menu - mobile only */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="md:hidden"
            aria-label="打开菜单"
          >
            <Menu className="h-6 w-6" aria-hidden="true" />
          </Button>

          {/* Logo - mobile only (desktop shows logo in sidebar) */}
          <h1 className="md:hidden text-xl font-bold">AI-Bridge</h1>

          {/* Search icon - mobile only */}
          {onSearchChange && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => {
                // For mobile: could open a full-screen search dialog
                // For now, just focus on the search input in filters
                onSearchChange('');
              }}
              aria-label="搜索"
            >
              <Search className="h-5 w-5" aria-hidden="true" />
            </Button>
          )}
        </div>

        {/* Center: Breadcrumb - desktop only */}
        <div className="flex-1 px-8 hidden md:block" role="navigation" aria-label="面包屑导航">
          <div className="text-sm text-muted-foreground">Navigation</div>
        </div>

        {/* Right: Search + Connection status + Help - desktop only */}
        <div className="hidden md:flex items-center gap-2">
          {/* Search bar */}
          {onSearchChange && (
            <SearchBar
              onSearch={onSearchChange}
              resultCount={resultCount}
              isSearching={isSearching}
            />
          )}

          <ConnectionStatusIndicator />

          {/* Keyboard shortcuts help button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onShortcutHelpClick}
                  aria-label="打开键盘快捷键帮助"
                >
                  <Keyboard className="h-5 w-5" aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>键盘快捷键 (Ctrl+/)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </nav>
    </header>
  );
}
