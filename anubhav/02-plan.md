# Personal AI OS — Phase 1: Second Brain

## Context

`anubhav/01-to-do.txt` is a master prompt for a long-term "Personal AI Operating System" — five eventual modules (Second Brain, Life Library, Life Dashboard, Review Agent, Marketing Kit) sharing one AI Core (LLM abstraction, embeddings, RAG, memory, agents). We are building **only Phase 1: Second Brain** — upload documents, ask questions, get cited answers — but the architecture must not block the other four modules later.

The repo is currently a bare `create-next-app` scaffold (Next 16.3.5, React 19.2.8, Tailwind v4, TypeScript) with no other code, no Prisma, not a git repo.

The to-do doc's reference stack (Docker, pgvector, Redis/BullMQ) assumed a Docker-based local setup. **Docker is not installed on this Windows machine and the user does not want to install it**, so three infra decisions were made with the user (confirmed via questions):

| Spec asked for | We're doing instead | Why |
|---|---|---|
| Docker Compose for all infra | **Native Windows installs**, no containers | User explicitly rejected Docker |
| PostgreSQL + **pgvector** | PostgreSQL only; embeddings as `Float[]` column, **brute-force cosine similarity in Node** | pgvector needs a Windows native compile (Visual Studio) without Docker — too fragile. Fine at personal-scale (hundreds–low-thousands of chunks). Hidden behind a `VectorStore` interface so pgvector can be swapped in later. |
| **Redis + BullMQ** for job queue | `ProcessingJob` table in Postgres + in-process async worker | No good native Redis on Windows. Hidden behind a `JobQueue` interface so BullMQ+Redis can be swapped in later. |
| Full authentication | **No login UI.** Single hardcoded seeded user (`DEFAULT_USER_ID`) | Personal single-user app for now. Every table still carries `userId` and every repository call takes `userId` explicitly, so real auth is a call-site change later, not a schema rewrite. |

These are genuine architecture simplifications, not corner-cutting: every removed piece (pgvector, Redis, auth) sits behind an interface (`VectorStore`, `JobQueue`, implicit `userId` scoping) specifically so it can be swapped in without touching the app once Docker/auth are wanted.

The UI is themed using the Anthropic/Claude.com brand system in `anubhav/design.md` (cream canvas, coral accent, dark-navy product surfaces, slab-serif display headings), adapted from a marketing site into an app shell (sidebar + dashboard + 3-pane chat), with full light/dark mode and responsive breakpoints.

**Non-negotiables preserved:** local Postgres, local vector storage, local job processing, local file storage, Gemini as the only implemented LLM/embedding provider but fully abstracted behind `LLMProvider`/`EmbeddingProvider` interfaces (never called directly outside one provider file), modular monolith (no microservices), reusable RAG engine (not hardcoded to "Second Brain").

---

## Architecture

```
                    Personal AI Platform
                            |
                        AI CORE (src/core)
        ┌───────────────────┼───────────────────┐
        ai/                 rag/                 jobs/ · storage/ · memory/
   LLMProvider          parsing → chunking →   JobQueue (Postgres-backed)
   EmbeddingProvider    embedding → retrieval   StorageProvider (local fs)
   (Gemini impl)         → citation             ConversationMemory (stub for future)
                            |
                      modules/second-brain (Phase 1 feature)
                            |
              app/ (Next.js UI)  +  app/api/ (route handlers)
```

Request layering: `Route Handler → Service (core/rag pipelines) → Repository (db/repositories) → Prisma → Postgres`. No business logic in React components.

Local vs. external boundary: local Postgres + local filesystem hold everything; only the Gemini API call leaves the machine (text sent for embedding/generation).

---

## Tech Stack

Already present: Next.js 16.3.5, React 19.2.8, Tailwind CSS v4, TypeScript.

Adding (exact versions pinned/verified at install time against npm — the numbers below are today's best-known values, not to be trusted blindly months from now):

- **DB/ORM**: `prisma` + `@prisma/client` (pin identical versions — avoid `@latest` drift between CLI and client), `@prisma/adapter-pg` + `pg` (Prisma 7+ requires an explicit driver adapter, no more bare `DATABASE_URL`-only client).
- **Validation**: `zod`.
- **AI**: `@google/genai` (official Gemini Node SDK) — the *only* file importing it is the Gemini provider pair.
- **Parsing**: `unpdf` (PDF → per-page text, pure JS, no native deps — avoids `pdf-parse`'s known bundler-crash bug), `mammoth` (DOCX), `csv-parse` (CSV). TXT/MD/JSON need no library.
- **UI**: `shadcn/ui` (Tailwind v4 + React 19 compatible), `lucide-react` (icons), `next-themes` (light/dark), `react-dropzone` (upload), `sonner` (toasts), `react-markdown` + `remark-gfm` (render assistant answers safely, no raw HTML injection), `date-fns`.
- **Data fetching**: `@tanstack/react-query` (poll document/job status, manage conversations/search cache).
- **Server boundary safety**: `server-only` — imported at the top of every `core/`, `db/`, `lib/config` file so a client component can never accidentally bundle Prisma/`pg`/the Gemini key.
- **Testing**: `vitest` + `@testing-library/react` + `jsdom`, targeting `core/` pure-logic modules (parsing, chunking, retrieval, citation, provider abstraction) — not RSC rendering.
- **Fonts**: via `next/font/google`, no install — Cormorant Garamond (serif display, the documented open-source substitute for Anthropic's proprietary Copernicus) + Inter (body/UI) + JetBrains Mono (code/citation snippets).

Gemini model IDs go through env config (`GEMINI_MODEL`, `EMBEDDING_MODEL`), not hardcoded — confirm current model names in Google AI Studio at implementation time since Google renames/deprecates these frequently.

---

## Folder Structure

```
prisma/
  schema.prisma
  seed.ts                    # inserts the one DEFAULT_USER_ID row
storage/documents/           # local file storage root (gitignored)
instrumentation.ts           # Next.js hook: starts the job worker + stuck-job recovery sweep once per server start
src/
  generated/prisma/          # Prisma client output (gitignored)
  core/
    ai/
      providers/
        llm/{llm-provider.ts, gemini-llm-provider.ts}
        embeddings/{embedding-provider.ts, gemini-embedding-provider.ts}
      provider-registry.ts   # resolves active provider from env/config
      prompts/{system-prompts.ts, rag-prompt.ts}
      schemas/                # zod schemas for structured LLM output
    rag/
      parsing/{document-parser.ts, pdf-parser.ts, docx-parser.ts, text-parser.ts, markdown-parser.ts, csv-parser.ts, json-parser.ts, parser-registry.ts}
      chunking/{chunker.ts, fixed-size-chunker.ts, paragraph-chunker.ts}
      retrieval/{vector-store.ts, postgres-brute-force-vector-store.ts, cosine-similarity.ts, reranker.ts}
      citation/{citation-builder.ts, location-formatter.ts}
      pipeline/{ingestion-pipeline.ts, query-pipeline.ts}
    storage/{storage-provider.ts, local-storage-provider.ts}
    jobs/{job-queue.ts, postgres-job-queue.ts, worker.ts, handlers/document-ingestion-handler.ts}
    memory/{memory-store.ts, conversation-memory.ts}   # interface now, minimal impl (conversation history only)
  db/
    client.ts                # Prisma + adapter-pg singleton, globalThis-guarded
    repositories/{document-repository.ts, chunk-repository.ts, conversation-repository.ts, message-repository.ts, collection-repository.ts, tag-repository.ts, job-repository.ts}
  lib/
    config/{env.ts, constants.ts}     # env.ts: zod-validated process.env; constants.ts: DEFAULT_USER_ID, chunk defaults
    validation/schemas/{document.ts, chat.ts, search.ts, collection.ts}
    logging/logger.ts
    errors/app-error.ts
  components/
    ui/                       # shadcn primitives
    layout/{app-shell.tsx, sidebar.tsx, topbar.tsx, theme-provider.tsx, theme-toggle.tsx}
    documents/{document-card.tsx, status-pill.tsx, upload-dropzone.tsx}
    chat/{conversation-list.tsx, chat-panel.tsx, message-bubble.tsx, citation-panel.tsx, citation-chip.tsx}
    dashboard/stat-tile.tsx
app/
  layout.tsx, globals.css, page.tsx (redirect → /dashboard)
  (app)/                       # route group: sidebar+topbar shell
    layout.tsx
    dashboard/page.tsx
    documents/{page.tsx, [documentId]/page.tsx}
    collections/{page.tsx, [collectionId]/page.tsx}
    chat/{page.tsx, [conversationId]/page.tsx}   # single page, client-side 3-pane CSS grid (not parallel routes)
    search/page.tsx
    settings/page.tsx
  api/
    documents/{route.ts, [documentId]/route.ts, [documentId]/reprocess/route.ts}
    collections/{route.ts, [collectionId]/route.ts}
    tags/route.ts
    conversations/{route.ts, [conversationId]/route.ts, [conversationId]/messages/route.ts}
    chat/route.ts               # POST → Server-Sent-Events stream
    search/route.ts             # POST → semantic search, no LLM call (proves RAG engine is reusable)
```

`agents/`, `tools/`, `events/` from the original spec are deliberately **not** created yet — Phase 1 needs none of them, and adding them empty would be premature scaffolding.

Next.js 16 specifics to respect: route `params` are `Promise`s (`await ctx.params`); use `proxy.ts` not `middleware.ts` if/when real auth is added (not needed now); do **not** enable `cacheComponents` (opt-in, forces `<Suspense>` everywhere, pure overhead for this always-dynamic-per-user app); mark data-driven route segments `export const dynamic = 'force-dynamic'` since Prisma reads give Next no automatic dynamic signal.

---

## Database Schema (Prisma)

Models: `User`, `Document`, `DocumentVersion`, `DocumentChunk` (has `embedding Float[]` — a native Postgres `double precision[]`, no extension needed), `Conversation`, `Message`, `Citation`, `Collection`, `Tag`, `DocumentTag`, `ProcessingJob`, `AIProviderConfig`.

Key points:
- Every user-owned table has a required `userId` column and every repository method takes `userId` explicitly (never implicit/optional) — this is what makes future real auth a call-site change, not a migration.
- `DocumentChunk` also carries `pageNumber` (PDF), `sectionPath` (DOCX/MD heading breadcrumb), `charStart`/`charEnd` — whatever location data the source format gives, feeding citations.
- `ProcessingJob` has `status`, `attempts`/`maxAttempts`, `lockedAt`/`lockedBy` — supports atomic claim-based processing (`UPDATE ... WHERE status='PENDING' RETURNING *`) so the in-process worker can't double-process a job even across hot-reloads.
- `Citation` links a `Message` to the specific `DocumentChunk`s used, with `similarityScore`, `rank`, and a human-readable `locationLabel` ("Page 4", "Rows 12–40", "Section: Coverage > Limits").
- `AIProviderConfig` exists per spec (future per-user provider switching UI) but Phase 1 just reads `GEMINI_MODEL`/`EMBEDDING_MODEL` from env; the table is present but not yet driving runtime behavior.

`DEFAULT_USER_ID` is a hardcoded constant in `lib/config/constants.ts`; `prisma/seed.ts` inserts exactly one `User` row with that id.

Prisma 7 requires an explicit driver adapter (`@prisma/adapter-pg` wrapping `pg`) — `new PrismaClient()` alone will throw. `prisma migrate dev`'s shadow database needs the local Postgres role to have `CREATEDB`, or `shadowDatabaseUrl` set explicitly — call this out in setup docs since the failure mode is a confusing permissions error.

---

## Document Ingestion Pipeline

1. Upload dropzone → `POST /api/documents` (multipart). Reject by `content-length` before reading body (size cap, e.g. 50MB) and by mimetype/extension allowlist (Zod).
2. Generate a random storage key (never trust the original filename as a path) → `LocalStorageProvider.save()` writes under `storage/documents/<userId>/<key>`.
3. Transaction: create `Document` (`UPLOADED`) + `DocumentVersion` (v1) + `ProcessingJob` (`PENDING`). Return `201` immediately — do not block on processing.
4. In-process `worker.ts` poll loop (started once from `instrumentation.ts`, singleton-guarded via `globalThis`) atomically claims the oldest `PENDING` job.
5. `Document.status → PROCESSING`. `ingestion-pipeline.ts`: read file → pick parser by file type from `parser-registry` → extract text (PDF gives per-page text; DOCX gives heading-aware text; CSV/JSON get row/record-based splitting) → normalize → chunk (configurable size/overlap, chunker never crosses a PDF page boundary so every chunk keeps one `pageNumber`) → `EmbeddingProvider.embed()` in batches → bulk-insert `DocumentChunk` rows.
6. Success → `Document.status = READY`, job `COMPLETED`. Failure → retry up to `maxAttempts`, then `Document.status = FAILED` with `errorMessage` stored.
7. UI polls document list via React Query (`refetchInterval` while anything is `UPLOADED`/`PROCESSING`) for live status pills. Reprocess endpoint re-queues steps 3–6.
8. On server start, a recovery sweep resets any job stuck `RUNNING` past a timeout back to `PENDING`, so a crash mid-ingestion doesn't strand a document in `PROCESSING` forever.

## Query / Chat Pipeline

1. `POST /api/chat` `{ conversationId?, message, collectionId?, tagIds? }` → create conversation if needed, persist user `Message`.
2. Embed the query → `VectorStore.retrieve()`: repository fetches candidate chunks scoped by `userId` + optional collection/tag filters + `Document.status = READY` (narrow `select`, never the full row) → brute-force cosine similarity scored in Node → top-K, then a light lexical-overlap rerank → top-N kept for context.
3. `citation-builder.ts` numbers the kept chunks and assigns `locationLabel`s.
4. Assemble system prompt (grounding rules: use only given context, say when info is unavailable, never invent, distinguish fact from inference) + numbered context + recent history + new message → `LLMProvider.streamText()` (the only call site for Gemini generation).
5. Route handler streams tokens to the client over Server-Sent-Events (hand-rolled `ReadableStream`, not a third-party AI-SDK stream wrapper — keeps the route bound to our own `LLMProvider` interface, not a vendor's). On stream end, persist the assistant `Message` + one `Citation` row per chunk actually placed in context (regardless of whether the model's prose explicitly references it — more robust than parsing `[n]` markers out of free text for Phase 1), then emit citations to the client.
6. Citation click → fetch the chunk plus its immediate neighbors (`chunkIndex ± 1`) for surrounding context.
7. `POST /api/search` reuses steps 2–3 with no LLM call — same engine, proving the RAG core isn't Second-Brain-specific (it's what Life Library will call later).

---

## UI / Design System (from `anubhav/design.md`)

Translating a marketing brand system into an app shell:

- **Palette**: cream canvas `#faf9f5` as the app background, `surface-card` `#efe9de` for panels/cards, coral `#cc785c` used sparingly (primary buttons, active nav indicator, focus rings) — never as a general background. Dark-navy `#181715` surfaces for elevated/product-chrome elements: citation source cards, code/JSON previews, the chat's source panel.
- **Typography**: Cormorant Garamond (serif, weight 500, negative tracking) for page titles and section headers only; Inter for all body text, nav, buttons, labels; JetBrains Mono for citation snippets and raw document previews.
- **Light/dark mode**: `next-themes` + Tailwind `@custom-variant dark`, token-driven (cream↔dark-navy swap), togglable from the top bar, persisted client-side.
- **Layout**: left sidebar (Dashboard, Documents, Collections, Search, Chat, Settings; active item = coral left-accent bar + surface-card background), top bar with serif page title + theme toggle, main canvas with `rounded-lg` cream cards, `spacing.xl` (32px) internal padding.
- **Dashboard**: stat tiles (documents, collections, processing/failed counts), recent documents, recent conversations.
- **Documents**: dropzone (hairline dashed border, coral on drag-over), card/list view with status pills (READY=green, PROCESSING=amber, FAILED=red, UPLOADED=muted), detail page with metadata + processing timeline + reprocess/delete.
- **Chat**: 3-pane (conversations | chat thread | citations) as one client-side CSS grid page; collapses to tabbed single-pane on mobile.
- **Search**: input with coral focus ring, results show doc name, highlighted passage, relevance bar, badges.
- **Responsive**: sidebar → hamburger under 768px, document grid 3→2→1 columns, dashboard tiles stack, chat 3-pane → 1-pane with tab switcher, all touch targets ≥ 40px.

---

## Security, Observability, Testing (Phase 1 scope)

- File validation (mimetype/extension allowlist, size cap), safe generated filenames, Zod validation on every API route, Gemini key server-side only (never sent to the client), Prisma parameterization (no raw SQL string interpolation).
- `userId` scoping everywhere stands in for authorization until real auth exists.
- Structured logger (`lib/logging/logger.ts`) covering job lifecycle, LLM request latency, retrieval latency, errors — console-based for now, interface allows swapping to a real sink later. Never logs API keys or full document contents.
- Vitest coverage for: each parser (fixture files), chunking strategies, cosine-similarity ranking, citation building, provider interfaces (mocked), API validation schemas.

---

## Setup Prerequisites (no Docker)

1. Install PostgreSQL natively on Windows (`winget install --id PostgreSQL.PostgreSQL.17` or the EDB installer from postgresql.org) — runs as a Windows service. Add its `bin` folder to PATH for `psql`. Make sure no other process (old WSL/Docker Postgres) is already bound to port 5432.
2. Create a local database and a dev role with `CREATEDB` (needed for Prisma's shadow database during `migrate dev`).
3. Set `DATABASE_URL` in `.env`. No Redis, no Docker needed.
4. `npm install`, then `npx prisma migrate dev`, `npx prisma db seed`, `npm run dev`.
5. Add a real `GEMINI_API_KEY` in `.env` (get one from Google AI Studio) before documents/chat will work — parsing/chunking/UI all work without it, but embedding and generation will error without a key.

`.env.example` will document: `DATABASE_URL`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `EMBEDDING_PROVIDER`, `EMBEDDING_MODEL`, `AI_PROVIDER`, `STORAGE_PROVIDER=local`, `LOCAL_STORAGE_PATH`.

---

## Implementation Order

1. Write this approved plan to `anubhav/02-plan.md` (as explicitly requested), then proceed.
2. Install all packages; scaffold `.env.example`, `lib/config/env.ts` (Zod-validated).
3. Prisma schema, native Postgres connection wiring (`db/client.ts` with driver adapter), migration, seed script.
4. Core AI abstractions: `LLMProvider`/`EmbeddingProvider` interfaces + Gemini implementations + provider registry.
5. `StorageProvider` + local filesystem implementation.
6. `JobQueue` interface + Postgres-backed implementation + in-process worker + `instrumentation.ts` wiring (start worker + recovery sweep).
7. Parser registry + PDF/DOCX/TXT/MD/CSV/JSON parsers.
8. Chunking service (configurable, page-aware for PDF).
9. `VectorStore` interface + brute-force cosine implementation + retrieval filters (user/collection/tag).
10. Ingestion pipeline + query pipeline + citation builder, wired end-to-end.
11. API routes (documents, chat/SSE, search, collections, conversations) — thin, delegating to services/repositories.
12. App shell: fonts, theme tokens, light/dark mode, sidebar/topbar layout.
13. Documents UI (upload, list/grid, detail, status polling, reprocess/delete).
14. Chat UI (3-pane, streaming, citation panel + click-through).
15. Search UI, Dashboard UI, Settings UI, Collections/Tags CRUD wired into filters.
16. Error handling/toasts, structured logging pass.
17. Vitest suite for core RAG logic.
18. Responsive/visual polish pass across breakpoints; run the dev server and click through the app in a browser.
19. README with full native (no-Docker) setup instructions.

## Verification

- `npm run dev` starts cleanly against the native local Postgres instance.
- Upload a real PDF, DOCX, and TXT file; watch status go `UPLOADED → PROCESSING → READY` via the polling UI.
- Ask a question in Chat whose answer must come from an uploaded document; confirm the answer streams, citations appear, and clicking a citation shows the correct source chunk + surrounding context.
- Ask a question with no relevant document content; confirm the model says it doesn't have the information rather than inventing an answer.
- Run global Search and confirm semantic (non-exact-keyword) matches surface.
- Delete and reprocess a document; confirm state transitions and that old chunks are replaced, not duplicated.
- Restart `npm run dev`; confirm previously uploaded documents/conversations persist (local Postgres + filesystem survive restarts).
- Resize the browser through mobile/tablet/desktop breakpoints; confirm sidebar, chat 3-pane, and document grid all respond correctly; toggle light/dark mode.
- `npx vitest run` passes for parsing/chunking/retrieval/citation/provider-abstraction tests.
