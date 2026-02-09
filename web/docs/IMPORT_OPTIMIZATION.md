# Import Optimization Best Practices

This document outlines the import optimization patterns used in AI-Bridge to minimize bundle size.

## Cherry-Picking Imports

### ✅ Correct: Named Imports

Always use named imports for icon libraries and utility libraries:

```typescript
// ✅ GOOD - Only imports what you need
import { Search, Download, Settings } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
```

### ❌ Incorrect: Wildcard Imports

Never import entire libraries with wildcard:

```typescript
// ❌ BAD - Imports entire icon library (100KB+)
import * as Icons from 'lucide-react';

// ❌ BAD - Imports entire date-fns library
import * as dateFns from 'date-fns';
```

## Exception: Standard Patterns

Some wildcard imports are standard and acceptable:

```typescript
// ✅ ACCEPTABLE - Standard React pattern
import * as React from 'react';

// ✅ ACCEPTABLE - Radix UI primitives (needed for types)
import * as SelectPrimitive from '@radix-ui/react-select';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
```

## Tree-Shaking Friendly Libraries

These libraries support tree-shaking with named imports:

- **lucide-react**: Icon library (3KB per icon vs 100KB+ for all)
- **date-fns**: Date utilities (each function is standalone)
- **@radix-ui/***: Component primitives (each component is separate)

## Verification

After making import changes, verify bundle impact:

```bash
npm run build
npm run analyze
```

Check that:
- Main bundle size decreases
- Chunk sizes are optimized
- No unused code in bundle

## Current Status

✅ All lucide-react imports are cherry-picked
✅ All date-fns imports are cherry-picked
✅ Radix UI primitives use standard pattern
✅ No wildcard imports for utility libraries

## Bundle Size Targets

| Metric | Target | Current |
|--------|--------|---------|
| Main bundle (gzipped) | < 500KB | TBD |
| react-vendor chunk | < 100KB | TBD |
| ui-vendor chunk | < 150KB | TBD |
| markdown-vendor chunk | < 200KB | TBD |

Run `npm run analyze` after build to see actual numbers.
