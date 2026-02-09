/**
 * SkipLink Component
 *
 * Provides a "skip to main content" link for keyboard users.
 * This link is hidden by default but becomes visible when focused.
 *
 * WCAG 2.1 Success Criterion 2.4.1: Bypass Blocks
 */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring"
    >
      跳过导航,直接进入主内容
    </a>
  );
}
