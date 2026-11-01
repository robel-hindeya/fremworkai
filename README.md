# Fremwork — Autonomous Financial AI Assistant & Workspace

An enterprise financial workspace for business owners, CFOs, and finance teams.
Built according to the official **Fremwork Backend Design** by Robel Hindeya (@selam).

---

## Architecture Overview

```
apps/
  ├── api/             # NestJS 10 API with global prefix /v1 (Port 4000)
  │                    # - Unified Ledger (stored in integer minor units / cents)
  │                    # - AI Assistant: Claude Tool Use & exact math calculations
  │                    # - SSE Streaming answer blocks (text, table, chart, calc, recommendation)
  │                    # - BullMQ queue runner (source.sync, upload.parse, task.run, export.build)
  │                    # - Swagger OpenAPI Docs at http://localhost:4000/v1/docs
  └── web/             # Next.js 16.4.3 (App Router) Frontend (Port 3000)
                       # - 35 routes, optimistic state updates, zero CVEs
                       # - Proxies /v1/:path* to NestJS backend API
packages/
  └── types/           # Shared TypeScript domain models (@fremwork/types)
                       # - MinorUnit integer type, AnswerBlock, Workspace, Profile, etc.
supabase/
  └── migrations/      # 00001_initial_schema.sql (13 Postgres tables with RLS isolation)
```

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Build Monorepo Workspaces
```bash
npm run build:types
npm run build:api
npm run build:web
```

### 3. Start NestJS Backend API (Port 4000)
```bash
npm run start:api
# Or for live development watch mode:
npm run dev:api
```
- API Base: `http://localhost:4000/v1`
- Swagger OpenAPI Documentation: `http://localhost:4000/v1/docs`

### 4. Start Next.js Frontend (Port 3000)
```bash
npm run dev:web
```
Open [http://localhost:3000](http://localhost:3000). It redirects to `/chat`.

---

## Core Principles

1. **Integer Minor Units**: All monetary amounts are strictly stored as integer cents (`amount_minor BIGINT`, `MinorUnit`). Floating-point arithmetic on currency is forbidden.
2. **Multi-Tenancy Isolation**: Every table and request enforces `workspace_id`. Requests validate `X-Workspace-Id` header and Supabase Row-Level Security (RLS).
3. **AI Never Guesses**: The AI model (Claude via Anthropic API) is bound by deterministic calculation tools (`calculate`, `query_transactions`, `simulate_scenario`).
4. **Structured Answer Blocks**: Answers stream via Server-Sent Events (SSE) as typed blocks (`text`, `table`, `calc`, `recommendation`), rather than monolithic markdown prose.
5. **Background Offloading**: Heavy tasks (bank sync, file OCR/parsing, scheduled runs) are processed off the request path via BullMQ background workers.
