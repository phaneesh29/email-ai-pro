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
			description: 'AI assistant that replies to inbound emails, backed by Resend, Upstash QStash, and Mistral.',
			howItWorks: [
				'1. Resend receives an inbound email and POSTs an email.received event to /api/webhook.',
				'2. /api/webhook verifies the Resend signature, checks the recipient, and queues a job via Upstash QStash.',
				'3. QStash delivers the job to /api/worker (rate-limited to protect the Resend API quota).',
				'4. /api/worker fetches the full email, generates an AI reply (with optional web_search / web_extract tools), and sends the reply via Resend.',
			],
			usage: 'This is not a public API — there are no user-facing endpoints to call directly. Just send an email to the configured inbound address and wait for a reply.',
			endpoints: [
				{
					method: 'POST',
					path: '/api/webhook',
					description: 'Resend inbound webhook receiver. Requires a valid Svix signature; not intended for manual calls.',
				},
				{
					method: 'POST',
					path: '/api/worker',
					description: 'QStash job consumer. Requires a valid Upstash signature; not intended for manual calls.',
				},
			],
			source: 'https://github.com/phaneesh29/email-ai-pro',
		},
		200
	);
}

export default { fetch: handler };
