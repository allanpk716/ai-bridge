# AI-Bridge Web Interface

This is the web frontend for AI-Bridge, a lightweight Go middleware that provides remote access to Claude Code CLI through HTTP/WebSocket APIs.

## Tech Stack

- **React 19.2** - Latest React with improved performance and features
- **TypeScript 5.9** - Type-safe development
- **Vite 7** - Fast build tool and dev server with HMR
- **ESLint** - Code linting for React and TypeScript
- **Prettier** - Code formatting

## Prerequisites

- Node.js 18+ and npm

## Installation

```bash
# Install dependencies
npm install
```

## Development

```bash
# Start development server (runs on http://localhost:3000)
npm run dev

# Format code with Prettier
npm run format

# Lint code
npm run lint
```

## Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Configuration

### Path Aliases

The project uses `@/` as an alias for the `src/` directory:

```tsx
// Instead of:
import App from './App'
import utils from '../utils/helpers'

// Use:
import App from '@/App'
import utils from '@/utils/helpers'
```

### API Proxy

The Vite dev server is configured to proxy API requests to the AI-Bridge backend:

- `/api/*` → `http://localhost:8080/api/*`
- `/socket.io/*` → `http://localhost:8080/socket.io/*` (WebSocket)

This allows the frontend to communicate with the backend during development without CORS issues.

## Project Structure

```
web/
├── src/
│   ├── App.tsx          # Main application component
│   ├── main.tsx         # Application entry point
│   └── assets/          # Static assets
├── public/              # Public files
├── index.html           # HTML template
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
├── eslint.config.js     # ESLint configuration
└── .prettierrc          # Prettier configuration
```

## Next Steps

This is the foundation for the AI-Bridge web interface. The following features will be added in subsequent phases:

- Session management UI
- Real-time chat interface with message streaming
- Permission request handling
- Slash command execution
- PWA capabilities
- Dark mode support

For more information, see the main project README in the parent directory.
