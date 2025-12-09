# VipuDevAI Studio

## Overview

VipuDevAI Studio is an AI-powered development environment that combines a code editor, chat assistant, code execution sandbox, image generation, and deployment tools into a single web application. The platform allows users to create and manage projects, interact with AI for coding assistance, run JavaScript/Python code, generate images with DALL·E, and deploy to cloud providers.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight alternative to React Router)
- **State Management**: TanStack React Query for server state, React hooks for local state
- **Styling**: Tailwind CSS with custom theme (green/lime color scheme)
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Code Editor**: Monaco Editor (@monaco-editor/react) for syntax-highlighted editing
- **Build Tool**: Vite with custom plugins for meta images and Replit integration

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (compiled with tsx for development, esbuild for production)
- **API Design**: RESTful JSON APIs under `/api` prefix
- **Authentication**: Token-based auth with in-memory token storage, admin credentials from environment variables
- **File Handling**: Multer for file uploads, AdmZip for ZIP file operations

### Data Storage
- **Database**: PostgreSQL via Neon serverless (@neondatabase/serverless)
- **ORM**: Drizzle ORM with Zod schema validation
- **Schema Location**: `shared/schema.ts` defines all database tables (users, projects, chatMessages, codeExecutions, userConfig)
- **Migrations**: Managed via drizzle-kit with `npm run db:push`

### Key Features
1. **App Builder**: Generative Developer Agent that builds complete full-stack applications
   - Generates entire project structures (backend, frontend, database, deployment)
   - Supports multiple templates: School Management, E-Commerce, Chat App, Blog, CRM, API, Dashboard
   - Tech stack selection: React+Node, React+FastAPI, Next.js, Vue+Express
   - File tree viewer with Monaco code preview
   - One-click ZIP download of entire project
   - GitHub-ready export with README
2. **AI Chat with Multiple Modes**:
   - **Chat Mode**: General conversation with GPT-4
   - **Search Mode**: Perplexity-style intelligent search with NLU
     - Query understanding and rewriting
     - Intent detection and reasoning
     - Multi-source web search (DuckDuckGo, Wikipedia)
     - Synthesized answers with citations
     - Follow-up question suggestions
   - **Explain Code Mode**: Paste code and get step-by-step explanations
   - **Debug Mode**: Paste buggy code, describe error, get fixes
   - **Learn Mode**: Beginner-friendly tutorials and explanations
   - Voice input using Web Speech API
   - Real-time web search integration
   - Persistent conversation memory
3. **Code Diff Viewer**: Visual before/after comparison of code changes
4. **Project Management**: CRUD operations for multi-file projects stored in PostgreSQL
5. **Code Execution**: Server-side JavaScript/Python execution using child processes
6. **Image Generation**: DALL·E 3 integration for AI image creation
7. **Live Sandbox**: HTML/CSS/JS editor with live preview
8. **Deployment Guidance**: Integration points for Vercel, Render, and Railway deployments

### Build Process
- Development: `npm run dev` runs tsx for hot-reloading
- Production: `npm run build` uses custom script (`script/build.ts`) that bundles client with Vite and server with esbuild
- Output: `dist/` directory with `index.cjs` (server) and `public/` (static assets)

## External Dependencies

### Database
- **Neon PostgreSQL**: Serverless Postgres database, connection via `DATABASE_URL` environment variable

### AI Services
- **OpenAI API**: Used for chat completions and DALL·E image generation
  - Supports Replit AI Integrations (`AI_INTEGRATIONS_OPENAI_BASE_URL`)
  - Falls back to `OPENAI_API_KEY` environment variable
  - Users can provide their own API key through the config page

### Environment Variables Required
| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `ADMIN_USERNAME` | Login username (default: admin) |
| `ADMIN_PASSWORD` | Login password (default: admin123) |
| `OPENAI_API_KEY` | OpenAI API key (optional if using Replit AI) |
| `NODE_ENV` | Environment mode (development/production) |

### Third-Party Libraries
- **UI**: Radix UI primitives, Lucide icons, class-variance-authority
- **Data**: TanStack React Query, Zod validation, date-fns
- **Editor**: Monaco Editor
- **File Handling**: AdmZip for ZIP operations, Multer for uploads