function json(body: unknown, status: number): Response {
	return new Response(JSON.stringify(body, null, 2), {
		status,
		headers: { 'content-type': 'application/json' },
	});
}

async function handler(req: Request): Promise<Response> {
	if (req.method !== 'GET') {
		return json({ ok: false, error: 'Method not allowed' }, 405);
	}

	return json(
		{
			name: 'Billion Dollar YAAA',
			tagline: 'An intelligent, queue-backed AI email companion powered by Mistral AI.',
			description: 'A robust, serverless agent designed to automatically process inbound emails, resolve tasks with real-time web access, and reply instantly using Markdown.',
			status: 'Operational',
			model: {
				name: 'codestral-2508',
				provider: 'Mistral AI',
				framework: 'Vercel AI SDK (ToolLoopAgent)'
			},
			endpoints: {
				metadata: {
					path: 'GET /api',
					description: 'Returns service configuration, setup guides, and operational status.'
				},
				webhook: {
					path: 'POST /api/webhook',
					description: 'Receives Resend inbound email webhook events. Verifies Svix signatures, parses the payload, and enqueues tasks to Upstash QStash.',
					security: 'Svix signature verification (RESEND_WEBHOOK_SECRET)'
				},
				worker: {
					path: 'POST /api/worker',
					description: 'Triggered asynchronously by Upstash QStash. Downloads the email text, executes web search/extraction tools, compiles the AI response, and replies via Resend.',
					security: 'Upstash QStash signature verification (QSTASH_CURRENT_SIGNING_KEY)'
				}
			},
			howToUse: {
				productionSetup: [
					'1. Verify your sender domain in your Resend Dashboard.',
					'2. Configure inbound email receiving for your domain in Resend.',
					'3. Create a Resend Webhook pointing to https://<your-vercel-domain>/api/webhook for the "email.received" event. Copy the webhook secret.',
					'4. Create an Upstash QStash account and get your QStash credentials.',
					'5. Configure Vercel environment variables with your keys (see .env.example) and set WORKER_URL to https://<your-vercel-domain>/api/worker.',
					'6. Deploy the project to Vercel.'
				],
				localTesting: [
					'1. Run "npm install" and copy ".env.example" to ".env" with your API keys.',
					'2. Start the local server with "npm run dev" (runs on port 3000 by default).',
					'3. Use ngrok or localtunnel to expose port 3000: "ngrok http 3000".',
					'4. Set the tunnel URL in your Resend Webhooks and Upstash QStash settings to test inbound flows locally.'
				],
				clientInteraction: 'Simply send an email to ai@tsindia.org. The service will process your query in the background and reply with a structured Markdown response.'
			},
			features: [
				'Zero-Loss Queueing: Leverages Upstash QStash for reliable message routing and rate-limiting.',
				'Active Web Intelligence: Employs Tavily to search the live web and extract clean Markdown from references.',
				'Secure-by-Design: Enforces signature verification for both inbound webhooks and background queue workers.',
				'Self-Contained Resolution: Crafts comprehensive, single-turn replies formatted in beautiful Markdown, optimized for email clients.'
			],
			howItWorks: [
				'1. Inbound email triggers a webhook verified via Svix signature.',
				'2. Webhook handler enqueues the payload to Upstash QStash to guarantee delivery.',
				'3. QStash dispatches the job to a rate-limited background worker.',
				'4. Worker executes any required tool calls (web search or site extraction) before compiling the final response.',
				'5. Assistant sends the response back to the sender using Resend.'
			],
			source: 'https://github.com/phaneesh29/email-ai-pro',
		},
		200
	);
}

export default { fetch: handler };
