import React, { useState, useCallback, lazy, Suspense } from 'react';
import { Check, Copy } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Lazy load syntax highlighter (heavy library)
const Prism = lazy(() =>
  import('react-syntax-highlighter').then(module => ({
    default: module.Prism
  }))
);

// Lazy load themes
const loadThemes = async () => {
  const module = await import('react-syntax-highlighter/dist/esm/styles/prism');
  return {
    vscDarkPlus: module.vscDarkPlus,
    vs: module.vs
  };
};

let themesCache: Awaited<ReturnType<typeof loadThemes>> | null = null;

/**
 * CodeBlock - Syntax-highlighted code block component
 *
 * Features:
 * - Syntax highlighting for 100+ languages via Prism.js
 * - Language detection and label display
 * - Copy button with visual feedback
 * - Theme-aware styling (dark/light mode)
 * - Card-style layout with top bar
 */

export interface CodeBlockProps {
  /** The code content to display */
  code: string;
  /** Programming language (detected from ```lang or default to 'text') */
  language?: string;
  /** Optional custom className for styling */
  className?: string;
}

/**
 * Language alias mapping for common language shortcuts
 */
const LANGUAGE_ALIASES: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  py: 'python',
  rb: 'ruby',
  go: 'go',
  rs: 'rust',
  c: 'c',
  cpp: 'cpp',
  cs: 'csharp',
  java: 'java',
  kt: 'kotlin',
  swift: 'swift',
  sh: 'bash',
  shell: 'bash',
  yaml: 'yaml',
  yml: 'yaml',
  json: 'json',
  xml: 'xml',
  html: 'html',
  css: 'css',
  scss: 'scss',
  sql: 'sql',
  md: 'markdown',
  txt: 'text',
};

/**
 * Normalize language name using alias mapping
 */
function normalizeLanguage(lang?: string): string {
  if (!lang) return 'text';
  const normalized = lang.toLowerCase();
  return LANGUAGE_ALIASES[normalized] || normalized;
}

/**
 * CodeBlock component with syntax highlighting and copy functionality
 */
const CodeBlockComponent: React.FC<CodeBlockProps> = ({ code, language, className }) => {
  const { resolvedTheme } = useTheme();
  const [copied, setCopied] = useState(false);
  const [themes, setThemes] = useState(themesCache);

  // Load themes on mount
  React.useEffect(() => {
    if (!themesCache) {
      loadThemes().then(loadedThemes => {
        themesCache = loadedThemes;
        setThemes(loadedThemes);
      });
    }
  }, []);

  // Normalize language and select theme based on current theme
  const normalizedLanguage = normalizeLanguage(language);
  const isDark = resolvedTheme === 'dark';
  const theme = themes ? (isDark ? themes.vscDarkPlus : themes.vs) : null;

  /**
   * Copy code to clipboard with visual feedback
   */
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  }, [code]);

  return (
    <div
      className={cn(
        'my-4 rounded-lg border border-border shadow-sm overflow-hidden',
        'bg-card',
        className
      )}
    >
      {/* Top bar with language label and copy button */}
      <div
        className={cn(
          'flex items-center justify-between px-4 py-2',
          'border-b border-border',
          'bg-muted/50'
        )}
      >
        {/* Language label */}
        <span
          className={cn(
            'text-xs font-medium',
            'text-muted-foreground',
            'uppercase tracking-wide'
          )}
        >
          {normalizedLanguage}
        </span>

        {/* Copy button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className={cn(
            'h-7 px-2',
            'text-muted-foreground hover:text-foreground',
            'transition-colors'
          )}
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-1" />
              <span className="text-xs">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-1" />
              <span className="text-xs">Copy</span>
            </>
          )}
        </Button>
      </div>

      {/* Code content with syntax highlighting */}
      <div className="overflow-x-auto">
        <Suspense
          fallback={
            <pre
              className={cn(
                'p-4',
                'bg-muted/30',
                'text-sm',
                isDark ? 'text-gray-300' : 'text-gray-700'
              )}
            >
              {code}
            </pre>
          }
        >
          {theme && (
            <Prism
              language={normalizedLanguage}
              style={theme}
              customStyle={{
                margin: 0,
                borderRadius: '0 0 0.5rem 0.5rem',
                background: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.5)',
                fontSize: '0.875rem',
                lineHeight: '1.5',
              }}
              codeTagProps={{
                style: {
                  fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace',
                },
              }}
            >
              {code}
            </Prism>
          )}
        </Suspense>
      </div>
    </div>
  );
};

/**
 * Memoized CodeBlock to prevent unnecessary re-renders
 * Only re-renders when code or language changes
 */
export const CodeBlock = React.memo(CodeBlockComponent, (prevProps, nextProps) => {
  return (
    prevProps.code === nextProps.code &&
    prevProps.language === nextProps.language &&
    prevProps.className === nextProps.className
  );
});

CodeBlock.displayName = 'CodeBlock';

export default CodeBlock;
