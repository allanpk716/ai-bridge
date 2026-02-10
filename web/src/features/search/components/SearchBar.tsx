import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchBarProps {
  onSearch: (query: string) => void;
  resultCount?: number;
  isSearching?: boolean;
}

export function SearchBar({ onSearch, resultCount, isSearching }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const debounceRef = useRef<number | undefined>();

  // Debounce search input (300ms)
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = window.setTimeout(() => {
      onSearch(query);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, onSearch]);

  const handleClear = useCallback(() => {
    setQuery('');
    onSearch('');
  }, [onSearch]);

  return (
    <div className="relative flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="搜索会话和消息..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 pr-9"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {(query || isSearching) && (
        <div className="text-sm text-muted-foreground whitespace-nowrap">
          {isSearching ? (
            '搜索中...'
          ) : resultCount !== undefined ? (
            resultCount > 0 ? `找到 ${resultCount} 个结果` : '未找到匹配结果'
          ) : null}
        </div>
      )}
    </div>
  );
}
