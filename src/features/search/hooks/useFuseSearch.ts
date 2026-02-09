import Fuse from 'fuse.js';
import { useMemo } from 'react';

interface SearchOptions {
  keys: string[];
  threshold?: number;
  includeScore?: boolean;
}

export function useFuseSearch<T>(
  data: T[],
  searchQuery: string,
  options: SearchOptions
) {
  const fuse = useMemo(() => {
    return new Fuse(data, {
      includeScore: true,
      threshold: options.threshold ?? 0.3,
      keys: options.keys,
    });
  }, [data, options.keys, options.threshold]);

  const results = useMemo(() => {
    if (!searchQuery.trim()) {
      return data;
    }
    return fuse.search(searchQuery).map(result => result.item);
  }, [fuse, searchQuery, data]);

  return results;
}
