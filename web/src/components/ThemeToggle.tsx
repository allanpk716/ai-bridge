import { Sun, Moon, Monitor } from 'lucide-react';
import { Button } from './ui/button';
import { useTheme } from '../hooks/useTheme';
import { Theme } from '../hooks/useTheme';

/**
 * ThemeToggle component
 *
 * Displays current theme with icon and allows cycling through:
 * light → dark → system → light
 *
 * Features:
 * - Sun icon for 'light' theme
 * - Moon icon for 'dark' theme
 * - Monitor icon for 'system' theme
 * - Small size, ghost variant button
 * - Aria label for accessibility
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    const themes: Theme[] = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-[1.2rem] w-[1.2rem]" />;
      case 'dark':
        return <Moon className="h-[1.2rem] w-[1.2rem]" />;
      case 'system':
        return <Monitor className="h-[1.2rem] w-[1.2rem]" />;
    }
  };

  const getAriaLabel = () => {
    switch (theme) {
      case 'light':
        return 'Current: Light theme. Click to switch to dark theme.';
      case 'dark':
        return 'Current: Dark theme. Click to switch to system theme.';
      case 'system':
        return 'Current: System theme. Click to switch to light theme.';
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycleTheme}
      className="h-9 w-9"
      aria-label={getAriaLabel()}
    >
      {getIcon()}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
