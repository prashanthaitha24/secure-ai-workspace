# Secure AI Workspace

A production-grade team collaboration platform for engineering and DevOps teams. Combines encrypted real-time chat, video meetings with AI-generated notes, file storage, and an admin dashboard — all in a dark, developer-focused UI.

## Features

- **Real-time chat** — public/private channels, direct messages, edit/delete, Ably WebSocket sync
- **Video meetings** — LiveKit-powered rooms with start/join/end lifecycle
- **AI meeting notes** — Groq (Llama 3.3 70B) generates summary, key points, action items, and decisions from transcripts
- **File storage** — drag-and-drop upload to Vercel Blob (500MB limit), file grid with download/delete
- **Multi-workspace** — create workspaces, invite members with time-limited codes, switch between workspaces
- **RBAC** — OWNER / ADMIN / MEMBER / GUEST roles enforced on every API route
- **Audit logging** — every write operation recorded with actor, action, resource, and metadata
- **Admin dashboard** — usage stats, security status panel, live audit log feed

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, TypeScript) |
| Auth | Clerk v7 (Core 3) |
| Database | Neon PostgreSQL + Prisma 7 |
| Realtime | Ably |
| Video | LiveKit |
| AI | Groq — Llama 3.3 70B via AI SDK v6 |
| File Storage | Vercel Blob |
| UI | shadcn/ui (Base UI) + Tailwind CSS |
| Deployment | Vercel |

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/prashanthaitha24/secure-ai-workspace.git
cd secure-ai-workspace
npm install
```

### 2. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in `.env.local` — see [Environment Variables](#environment-variables) below for where to get each key.

### 3. Run database migrations

```bash
npx prisma migrate dev --name init
```

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | [neon.tech](https://neon.tech) → project → Connection Details → Pooled connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | [clerk.com](https://clerk.com) → app → API Keys |
| `CLERK_SECRET_KEY` | Same as above |
| `ABLY_API_KEY` | [ably.com](https://ably.com) → app → API Keys → Root key |
| `NEXT_PUBLIC_ABLY_API_KEY` | Same key as `ABLY_API_KEY` |
| `LIVEKIT_API_KEY` | [cloud.livekit.io](https://cloud.livekit.io) → project → Settings → Keys |
| `LIVEKIT_API_SECRET` | Same as above |
| `NEXT_PUBLIC_LIVEKIT_URL` | Same page — WebSocket URL (`wss://your-project.livekit.cloud`) |
| `GROQ_API_KEY` | [console.groq.com/keys](https://console.groq.com/keys) — free tier: 14,400 req/day |
| `BLOB_READ_WRITE_TOKEN` | Vercel dashboard → project → Storage → add Blob store → auto-injected, then `vercel env pull .env.local` |

## Project Structure

```
src/
├── app/
│   ├── (auth)/               # Sign-in / sign-up pages
│   ├── (main)/workspace/     # Main app — channel, meetings, files, admin pages
│   ├── api/                  # Route handlers
│   │   ├── ably-auth/        # Ably token auth
│   │   ├── channels/         # Messages CRUD
│   │   ├── files/            # Vercel Blob upload/delete
│   │   ├── meetings/         # Meeting lifecycle + AI summarize
│   │   ├── messages/         # Edit/delete
│   │   └── workspaces/       # Workspace, channels, members, invites
│   ├── globals.css           # Dark DevOps theme (oklch tokens)
│   └── layout.tsx
├── components/
│   ├── chat/                 # MessageList, MessageItem, MessageInput, ChannelChat
│   ├── files/                # FileUploadZone, FileGrid
│   ├── layout/               # Sidebar, ChannelList, WorkspaceSwitcher
│   ├── meetings/             # MeetingRoom, AiNotes, NewMeetingButton
│   └── ui/                   # shadcn/ui components
├── lib/
│   ├── ably.ts               # Ably channel names + event constants
│   └── db.ts                 # Prisma client (PrismaPg adapter)
└── middleware.ts             # Clerk auth guard
prisma/
└── schema.prisma             # DB schema — 10 models, 4 enums
```

## API Reference

### Workspaces
| Method | Route | Description |
|---|---|---|
| POST | `/api/workspaces` | Create workspace + default channels |
| POST | `/api/workspaces/:id/channels` | Create channel |
| GET / PATCH / DELETE | `/api/workspaces/:id/members` | List / change role / remove member |
| POST | `/api/workspaces/:id/invite` | Generate invite code |
| GET | `/api/workspaces/:id/invite?code=` | Accept invite and join |

### Chat
| Method | Route | Description |
|---|---|---|
| GET / POST | `/api/channels/:id/messages` | List or send messages |
| PATCH / DELETE | `/api/messages/:id` | Edit or delete a message |
| GET | `/api/ably-auth` | Issue scoped Ably token for client |

### Meetings
| Method | Route | Description |
|---|---|---|
| GET / POST | `/api/workspaces/:id/meetings` | List or create meetings |
| POST | `/api/meetings/:id/start` | Start meeting (sets status LIVE) |
| POST | `/api/meetings/:id/end` | End meeting |
| GET | `/api/meetings/:id/token` | Issue LiveKit JWT for room access |
| POST | `/api/meetings/:id/summarize` | Generate AI notes via Groq |

### Files
| Method | Route | Description |
|---|---|---|
| POST | `/api/files` | Upload file to Vercel Blob |
| DELETE | `/api/files/:id` | Delete file (owner or admin) |

## Database Schema

10 models: `Workspace`, `WorkspaceMember`, `Channel`, `Message`, `Meeting`, `MeetingParticipant`, `MeetingTranscript`, `MeetingSummary`, `File`, `AuditLog`

```
Workspace ──< WorkspaceMember
          ──< Channel ──< Message
          ──< Meeting ──< MeetingParticipant
                      ──< MeetingTranscript
                      ──< MeetingSummary
          ──< File
          ──< AuditLog
```

## Git Workflow

```
main          ← stable, tagged releases
└── develop   ← integration branch, always green
      └── feature/*  ← one branch per feature, PR into develop
```

**Branch naming:** `feature/`, `fix/`, `chore/`
**Commit style:** `feat(scope):`, `fix(scope):`, `chore:`

### Release history

| Version | Date | Description |
|---|---|---|
| v0.1.0 | 2026-04-10 | Day 30 MVP — chat, video, AI notes, files, admin |

## Deployment

### Vercel (recommended)

1. Push to GitHub, import project at [vercel.com/new](https://vercel.com/new)
2. Add all environment variables in the Vercel dashboard
3. For `BLOB_READ_WRITE_TOKEN`: add a Blob store under the Storage tab — it auto-injects the token
4. Run migrations against production DB: `npx prisma migrate deploy`

## Pending / Roadmap

- [ ] Rename `src/middleware.ts` → `src/proxy.ts` (Next.js 16 migration)
- [ ] Branch protection on `main` (require PR review)
- [ ] Clerk webhook to sync user display names into DB
- [ ] Rate limiting on message send endpoint
- [ ] End-to-end encryption (client-side key management)
- [ ] Notification system (mentions, DMs)
- [ ] Mobile-responsive layout
- [ ] Search across messages and files
