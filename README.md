# Billion Dollar YAAA

AI email assistant. Email `ai@tsindia.org`, get an AI reply back — served entirely as 2 Vercel
serverless functions, using Upstash QStash as the queue between them (no Redis, no persistent worker process).

## How it works

```
Resend webhook → POST /api/webhook  (verify + fetch email + publish job)
                        │
                        ▼
                  Upstash QStash        (HTTP queue, retries/backoff, signs requests)
                        │
                        ▼
              POST /api/worker         (verify + generate AI reply + email it back)
```

## Project structure

```text
.
├── api/
│   ├── webhook/index.ts   # Resend webhook receiver ("listener")
│   └── worker/index.ts    # QStash target endpoint ("doer")
├── lib/
│   ├── config.ts          # env vars + constants (throws on boot if required ones are missing)
│   ├── ai.ts               # ToolLoopAgent (Mistral codestral-2508, fixed model, web_search/web_extract tools)
│   ├── tools.ts             # Tavily-backed web_search / web_extract tool definitions
│   ├── resend.ts           # Resend client + sendEmail helper
│   ├── qstash.ts            # QStash publish client + signature verifier
│   ├── job.ts               # zod schema for the job payload shared by both functions
│   └── email.ts             # extractEmailAddress / escapeHtml / getReplySubject helpers
├── vercel.json              # per-function maxDuration
├── tsconfig.json
└── .env.example
```

## Setup

1. `npm install`
2. Create an Upstash QStash project (https://console.upstash.com/qstash) and grab:
   - `QSTASH_TOKEN`
   - `QSTASH_CURRENT_SIGNING_KEY` / `QSTASH_NEXT_SIGNING_KEY`
3. Copy `.env.example` → `.env` and fill in Resend + `MISTRAL_API_KEY` + `TAVILY_API_KEY` (https://app.tavily.com) + QStash values. Leave `WORKER_URL` blank for now.
4. Deploy to Vercel (`vercel`), or link the project.
5. Set `WORKER_URL` to your deployed worker's absolute URL (e.g. `https://<project>.vercel.app/api/worker`) in Vercel's env vars, then redeploy — QStash needs a real reachable URL to call back into.
6. Point Resend's inbound webhook at `https://<project>.vercel.app/api/webhook`.

## Status

This is a from-scratch rewrite in progress (previous BullMQ/Redis/Express version is preserved in git
history at commit `d59e8d8`). Current state: end-to-end pipeline with a `ToolLoopAgent`
call (Mistral `codestral-2508`, fixed model, raw email body as the prompt) with `web_search`/`web_extract`
tools backed by Tavily.
Not yet ported: `horoscope_reading` sub-agent, `mail_sender` tool.
