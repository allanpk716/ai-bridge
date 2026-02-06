import { useState, useEffect } from 'react';

type ScrollDirection = 'up' | 'down' | null;

/**
 * useScrollDirection hook
 *
 * Detects scroll direction for auto-hiding navigation
 *
 * Features:
 * - Returns 'up' | 'down' | null
 * - Uses passive event listener for performance
 * - Cleans up listener on unmount
 * - Compares current scroll Y with last scroll Y
 *
 * Usage:
 * ```tsx
 * const scrollDirection = useScrollDirection();
 * <nav className={scrollDirection === 'down' ? '-translate-y-full' : 'translate-y-0'}>
 * ```
 */
export function useScrollDirection() {
  const [scrollDirection, setScrollDirection] = useState<ScrollDirection>(null);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Determine direction
      if (currentScrollY > lastScrollY) {
        // Scrolling down
        if (scrollDirection !== 'down') {
          setScrollDirection('down');
        }
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up
        if (scrollDirection !== 'up') {
          setScrollDirection('up');
        }
      }

      // Update last scroll position
      setLastScrollY(currentScrollY);
    };

    // Add scroll listener with passive option for performance
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Clean up listener on unmount
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY, scrollDirection]);

  return scrollDirection;
}
