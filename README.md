# Billion Dollar AI Email Assistant

An Express + BullMQ service that receives inbound emails through Resend webhooks, generates AI responses using Ollama-compatible models through the OpenAI Agents SDK, and sends replies back by email.

## What This Project Does

- Accepts signed inbound webhook events from Resend.
- Validates and fetches the incoming email content.
- Queues email-processing jobs in Redis using BullMQ.
- Runs a background worker that calls an AI agent to generate a response.
- Converts AI markdown output to HTML and emails the result to the original sender.
- Supports optional web search and web fetch tools for up-to-date answers.

## Core Capabilities

- Secure webhook verification using Svix headers and `RESEND_WEBHOOK_SECRET`.
- Async processing with retries and exponential backoff.
- Pluggable Ollama model routing by email subject.
- Tool-enabled agent responses:
	- `web_search` for quick public web lookup.
	- `web_fetch` for extracting web page content.
	- `horoscope_reading` for Vedic Jyotisha / Janma Kundali requests.
- Graceful shutdown for both API server and worker process.
- Health check endpoint for monitoring.

## Project Structure

```text
.
|-- app.js                      # Express app setup and middleware
|-- index.js                    # HTTP server bootstrap
|-- clients/
|   `-- resend.client.js        # Resend client
|-- config/
|   |-- index.js                # Env/config constants and defaults
|   `-- models.js               # Ollama model key map
|-- agents/
|   `-- horoscope.agent.js      # Dedicated Jyotisha-GPT agent
|-- controllers/
|   |-- health.controller.js    # Health endpoint handler
|   `-- webhook.controller.js   # Resend webhook processing
|-- queues/
|   `-- aiEmail.queue.js        # BullMQ queue and enqueue helper
|-- routes/
|   |-- health.routes.js
|   `-- webhook.routes.js
|-- tools/
|   |-- index.js                # Agent tool definitions
|   |-- horoscope.tool.js       # Horoscope agent-as-tool wrapper
|   `-- web.tool.js             # Web search/fetch tool runtime
|-- utils/
|   |-- ai.js                   # AI agent + model resolution
|   `-- send_email.js           # Outbound email utility
`-- workers/
		`-- aiEmail.worker.js       # Background job worker
```

## Request/Processing Flow

1. Resend sends `email.received` webhook to `POST /webhooks/resend`.
2. API verifies webhook signature.
3. API fetches full email payload from Resend.
4. API validates recipient and extracts sender + prompt.
5. API enqueues job in BullMQ (`ai-email-jobs`).
6. Worker consumes job, generates AI answer, sends reply email.
7. If generation fails, worker sends an error-notification email to sender.

## API Endpoints

### `GET /health`

Returns service health metadata.

Example response:

```json
{
	"ok": true,
	"environment": "development",
	"timestamp": "2026-04-21T10:00:00.000Z"
}
```

### `POST /webhooks/resend`

Consumes raw-text webhook payload from Resend.

- Requires Svix headers:
	- `svix-id`
	- `svix-timestamp`
	- `svix-signature`
- Processes only event type: `email.received`
- Returns `202` when job is queued.

## Environment Variables

Create a `.env` file in project root.

Required:

- `RESEND_API_KEY`: Resend API key for sending/fetching emails.

Strongly recommended / required for full flow:

- `RESEND_WEBHOOK_SECRET`: Required to verify inbound webhook signatures.

Optional (with defaults):

- `PORT` (default: `3000`)
- `NODE_ENV` (default: `development`)
- `EMAIL_FROM` (default: `AI <ai@tsindia.org>`)
- `REDIS_URL` (default: `redis://127.0.0.1:6379`)
- `OLLAMA_API_KEY` (default behavior falls back to `ollama` internally)

Internal constants:

- Ollama-compatible base URL is fixed to `https://ollama.com/v1/`.
- Default model fallback is `kimi-k2:1t`.

## Model Selection Behavior

The worker determines model from the email subject:

- If subject starts with `ollama/`, it is treated as a model key lookup in `config/models.js`.
- Otherwise, default model is used.
- If provided key is unknown, fallback still goes to default model.

Example subject values:

- `ollama/kimi-k2:1t`
- `ollama/gpt-oss:120b`

## Scripts

```bash
npm start        # Run API server
npm run dev      # Run API server in watch mode
npm run worker   # Run BullMQ worker
npm run worker:dev
```

## Local Development

1. Install dependencies:

	 ```bash
	 npm install
	 ```

2. Start Redis locally (or provide a remote `REDIS_URL`).

3. Configure `.env`.

4. Start API server:

	 ```bash
	 npm run dev
	 ```

5. In another terminal, start worker:

	 ```bash
	 npm run worker:dev
	 ```

6. Configure Resend inbound webhook URL to:

	 ```text
	 https://<your-domain>/webhooks/resend
	 ```

## Security Notes

- Webhook verification is mandatory in controller logic; requests fail if signature data is missing/invalid.
- Server uses Helmet and disables `x-powered-by`.
- JSON body size is limited to `100kb` for non-webhook routes.

## Operational Notes

- Queue jobs use:
	- `attempts: 3`
	- exponential backoff (`2000ms` base)
	- auto-removal on completion
- Worker emits completion/failure logs.
- Server and worker both handle `SIGINT` and `SIGTERM` for graceful shutdown.

## Tech Stack

- Node.js (ESM)
- Express 5
- BullMQ + ioredis
- Resend
- OpenAI Agents SDK + OpenAI client (Ollama-compatible endpoint)
- Zod
- Marked

