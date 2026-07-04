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
			model: {
				name: 'codestral-2508',
				provider: 'Mistral AI',
				framework: 'Vercel AI SDK (ToolLoopAgent)'
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
			usage: 'This system runs entirely in the background. Send a query to the configured email inbox, and the agent will reply in a single, well-structured email.',
			status: 'Operational',
			source: 'https://github.com/phaneesh29/email-ai-pro',
		},
		200
	);
}

export default { fetch: handler };
