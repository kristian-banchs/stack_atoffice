# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Stack AI frontend take-home assignment to build a custom Google Drive File Picker for Knowledge Base indexing. The application allows users to browse Google Drive files/folders through a connection, select resources to index into Knowledge Bases, and manage indexed files with real-time status updates.

## Tech Stack

- **Framework**: Next.js 15.5.5 with React 19 (App Router)
- **Build Tool**: Turbopack (via `--turbopack` flag)
- **Data Fetching**: Tanstack Query (to be added)
- **State Management**: Zustand (if needed)
- **Styling**: Tailwind CSS v4
- **Components**: Shadcn UI (to be added)
- **TypeScript**: Strict mode enabled

## Development Commands

### Running the Development Server
```bash
npm run dev
```
This starts the Next.js development server with Turbopack on http://localhost:3000

### Building for Production
```bash
npm run build
```
Creates an optimized production build using Turbopack

### Starting Production Server
```bash
npm start
```

### Linting
```bash
npm run lint
```
Runs ESLint with Next.js and TypeScript configurations

## Stack AI API Architecture

The application integrates with Stack AI's backend API at `https://api.stack-ai.com`. Key concepts:

### Authentication
- Uses Supabase Auth at `https://sb.stack-ai.com`
- Requires email/password login to obtain JWT access token
- All API requests need `Authorization: Bearer <token>` header
- Test credentials provided in README.md (not to be committed)

### Core Entities

**Connections** (`/connections`)
- Represents authenticated external service connections (e.g., Google Drive)
- Each connection has a `connection_id` and `connection_provider` (e.g., "gdrive")
- Used to browse and access external resources

**Resources** (`/connections/{connection_id}/resources`)
- Files and folders from the connected service
- Each resource has a `resource_id`, `inode_type` (file/directory), and `inode_path`
- Use `/resources/children` endpoint to list resources in a directory (similar to `ls`)
- Query params: `resource_id` (for specific folder) or none (for root)
- Response includes pagination with `next_cursor` and `current_cursor`

**Knowledge Bases** (`/knowledge_bases`)
- Collections of indexed resources for RAG/search
- Created with `connection_id` and array of `connection_source_ids` (resource IDs)
- Syncing is async via `/knowledge_bases/sync/trigger/{kb_id}/{org_id}`
- Resources have status: `pending`, `indexed`, or `being_indexed`
- Use `/knowledge_bases/{kb_id}/resources/children` to list KB contents
- Individual files can be added/deleted (not entire folders)

### Important API Patterns

1. **Hierarchical Navigation**: Like a file system, you must query each directory level separately. No way to fetch all resources at once (by design for scalability).

2. **Avoid Redundancy**: When indexing, don't include both a folder and its children in `connection_source_ids`. The backend will index all children automatically.

3. **Async Operations**: Syncing/indexing happens in background tasks. Poll or wait before checking status.

4. **Resource Paths**: Use `resource_path` query parameter (e.g., `/papers/file.txt`) for operations on specific paths within a KB.

## Key Implementation Requirements

### IMPORTANT: Development Philosophy

**Keep it simple and fast. This is a 2-day task - prioritize speed and UX over perfect architecture.**

- **DO NOT over-engineer** - Avoid unnecessary abstractions, complex state management patterns, or premature optimization
- **DO NOT bloat the codebase** - Keep components focused, avoid creating files/utilities unless absolutely needed
- **THINK before you code** - Consider how each change impacts other parts of the application. Changes to data fetching, state, or component structure can have ripple effects
- **PRIORITIZE optimistic updates** - Users should see instant feedback. Update UI immediately, sync with server in background, rollback on errors
- **PRIORITIZE speedy UI** - Every interaction should feel instant. Pre-fetch intelligently, use skeletons sparingly, minimize waterfalls

### Performance & UX Requirements
- **No loading spinners** - use skeleton states instead, and only when necessary
- **Pre-fetching** - fetch ahead where possible (e.g., when hovering over folders), but don't load entire drive at once
- **Optimistic UI** - CRITICAL: update UI immediately on user actions, rollback on errors with toast notifications (use Sonner)
- **Low CLS** - prevent layout shifts during interactions (reserve space for content before it loads)
- **Snappy interactions** - clicking folders, indexing files, deleting resources must feel instant

### Features to Implement
- File/folder browsing (like Finder/Explorer)
- Read resources from connection (hierarchical, directory by directory)
- Delete files from KB (de-indexing, not deleting from Drive)
- Index/de-index files and folders
- Show indexing status (indexed/not indexed/being indexed)
- Bonus: sorting, filtering, searching by name

### Code Quality Expectations
- Reusable React components (but don't create components you don't need yet)
- Custom hooks for logic encapsulation (data fetching, optimistic updates)
- Proper TypeScript typing
- Follow React best practices (proper `useEffect` usage, minimize re-renders)
- Next.js App Router conventions
- Comments where necessary (but code should be self-documenting)

## Project Structure

- `app/` - Next.js App Router pages and layouts
  - `page.tsx` - Home page (currently boilerplate)
  - `layout.tsx` - Root layout with Geist fonts
  - `globals.css` - Global Tailwind styles
- `public/` - Static assets
- Path alias: `@/*` maps to project root

## Notes

- This is a take-home assignment with a 2-day timeline
- Must be deployed to Vercel with live demo
- Test Google Drive connection already exists - DO NOT delete or create new connections
- See `api.ipynb` for detailed API examples and authentication flow
