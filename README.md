# Billion Dollar YAAA

> **Y**et **A**nother **A**I **A**pplication — an AI email assistant that turns any inbox into a conversational AI interface.

Send an email to `ai@tsindia.org`, get an AI-powered reply back. That's it.

Built with Express, BullMQ, Resend, and the OpenAI Agents SDK running Ollama-compatible models.

## How It Works

```
You send an email
  → Resend webhook triggers
  → Job queued in Redis
  → AI agent generates a response
  → Branded HTML reply sent back to you
```

## Features

- **Email-to-AI pipeline** — Receive inbound emails via Resend webhooks, process with AI, reply automatically.
- **Multi-model routing** — Choose any Ollama model by setting the email subject (e.g. `ollama/kimi-k2:1t`).
- **Agent tools**:
  - `web_search` — DuckDuckGo search for real-time information.
  - `web_fetch` — Extract content from any public URL.
  - `horoscope_reading` — Dedicated Vedic astrology sub-agent (Jyotisha-GPT) with web-backed ephemeris lookup for real planetary positions.
  - `mail_sender` — Send branded HTML emails to third parties on request.
- **Branded email templates** — Professional SaaS-style HTML emails with dark header, CTA buttons, and markdown body rendering.
- **Async job processing** — BullMQ with 3 retries, exponential backoff, and auto-cleanup.
- **Secure webhooks** — Svix signature verification on every inbound event.
- **Graceful shutdown** — Both API server and worker handle `SIGINT`/`SIGTERM`.

## Project Structure

```text
.
├── index.js                        # HTTP server bootstrap
├── app.js                          # Express app, middleware, routes
├── agents/
│   └── horoscope.agent.js          # Jyotisha-GPT sub-agent with ephemeris tools
├── clients/
│   └── resend.client.js            # Resend SDK client
├── config/
│   ├── index.js                    # Environment config, brand name, system prompt
│   └── models.js                   # Ollama model key → ID map
├── controllers/
│   ├── health.controller.js        # GET /health handler
│   └── webhook.controller.js       # POST /webhooks/resend handler
├── queues/
│   └── aiEmail.queue.js            # BullMQ queue + enqueue helper
├── routes/
│   ├── health.routes.js
│   └── webhook.routes.js
├── tools/
│   ├── index.js                    # Tool registry (all agent tools)
│   ├── horoscope.tool.js           # Horoscope agent-as-tool wrapper
│   ├── mail_sender.tool.js         # Branded email sending tool
│   └── web.tool.js                 # Web search + fetch runtime
├── utils/
│   ├── ai.js                       # AI agent creation + model resolution
│   └── send_email.js               # Outbound email via Resend
└── workers/
    └── aiEmail.worker.js           # Background job processor
```

## Request Flow

1. Resend fires `email.received` webhook → `POST /webhooks/resend`.
2. Controller verifies Svix signature headers.
3. Controller fetches full email from Resend API.
4. Validates recipient matches `EMAIL_FROM`, extracts sender + prompt.
5. Enqueues job in BullMQ (`ai-email-jobs`).
6. Worker picks up job → creates AI agent with tools → generates response.
7. Worker converts markdown response to HTML, emails reply to sender.
8. On failure, worker sends an error notification email instead.

## API Endpoints

### `GET /health`

```json
{
  "ok": true,
  "environment": "development",
  "timestamp": "2026-05-01T10:00:00.000Z"
}
```

### `POST /webhooks/resend`

Consumes raw-text webhook payload. Requires Svix headers (`svix-id`, `svix-timestamp`, `svix-signature`). Processes `email.received` events only. Returns `202` when job is queued.

## Environment Variables

Create a `.env` file in the project root.

| Variable | Required | Default | Description |
|---|---|---|---|
| `RESEND_API_KEY` | ✅ | — | Resend API key |
| `RESEND_WEBHOOK_SECRET` | ✅ | — | Svix webhook signing secret |
| `OLLAMA_API_KEY` | ❌ | `ollama` | API key for Ollama endpoint |
| `PORT` | ❌ | `3000` | HTTP server port |
| `NODE_ENV` | ❌ | `development` | Environment name |
| `EMAIL_FROM` | ❌ | `Billion Dollar YAAA <ai@tsindia.org>` | Sender address |
| `REDIS_URL` | ❌ | `redis://127.0.0.1:6379` | Redis connection URL |

Internal constants (in `config/index.js`):
- `BRAND_NAME` — `"Billion Dollar YAAA"` (used in emails, system prompt, templates)
- `OLLAMA_OPENAI_BASE_URL` — `https://ollama.com/v1/`
- `OLLAMA_DEFAULT_MODEL` — `kimi-k2:1t`

## Model Selection

The AI model is determined by the email subject line:

| Subject | Model Used |
|---|---|
| `ollama/kimi-k2:1t` | `kimi-k2:1t` |
| `ollama/gpt-oss:120b` | `gpt-oss:120b` |
| `ollama/deepseek-v3.2` | `deepseek-v3.2` |
| *(anything else)* | `kimi-k2:1t` (default) |

Full model list in `config/models.js`.

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your keys

# Start Redis (or set REDIS_URL to a remote instance)

# Terminal 1 — API server
npm run dev

# Terminal 2 — Background worker
npm run worker:dev

# Terminal 3 — Expose to internet (for Resend webhooks)
ngrok http 3000
```

Then set your Resend inbound webhook URL to:
```
https://<your-ngrok-domain>/webhooks/resend
```

## Scripts

| Script | Command | Description |
|---|---|---|
| `npm start` | `node index.js` | Production API server |
| `npm run dev` | `node --watch index.js` | Dev server with auto-reload |
| `npm run worker` | `node workers/aiEmail.worker.js` | Production worker |
| `npm run worker:dev` | `node --watch workers/aiEmail.worker.js` | Dev worker with auto-reload |

## DNS Setup (Email Deliverability)

For emails to land in inbox instead of spam, ensure these DNS records on your sending domain:

1. **SPF** — `v=spf1 include:send.resend.com ~all`
2. **DKIM** — CNAME records provided by Resend during domain verification
3. **DMARC** — `v=DMARC1; p=quarantine; rua=mailto:ai@tsindia.org; pct=100; adkim=s; aspf=s`

## Security

- Webhook signature verification is mandatory — requests fail without valid Svix headers.
- Helmet middleware enabled with `x-powered-by` disabled.
- JSON body limited to `100kb` on non-webhook routes.
- Webhook route receives raw text body (before JSON parser).

## Tech Stack

- **Runtime** — Node.js (ESM)
- **Framework** — Express 5
- **Queue** — BullMQ + ioredis
- **Email** — Resend
- **AI** — OpenAI Agents SDK + OpenAI client (Ollama-compatible)
- **Validation** — Zod 4
- **Markdown** — Marked
- **Security** — Helmet, express-rate-limit
