import type { WebhookEventPayload } from 'resend';
import { EMAIL_FROM, RESEND_WEBHOOK_SECRET, WORKER_URL } from '../../lib/config.js';
import { extractEmailAddress } from '../../lib/email.js';
import { qstashClient } from '../../lib/qstash.js';
import { resend } from '../../lib/resend.js';

function json(body: unknown, status: number): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'content-type': 'application/json' },
	});
}

async function handler(req: Request): Promise<Response> {
	if (req.method !== 'POST') {
		return json({ ok: false, error: 'Method not allowed' }, 405);
	}

	const payload = await req.text();
	const svixId = req.headers.get('svix-id');
	const svixTimestamp = req.headers.get('svix-timestamp');
	const svixSignature = req.headers.get('svix-signature');

	if (!payload || !svixId || !svixTimestamp || !svixSignature) {
		return json({ ok: false, error: 'Invalid webhook headers or payload' }, 400);
	}

	let event: WebhookEventPayload;
	try {
		event = resend.webhooks.verify({
			payload,
			headers: {
				id: svixId,
				timestamp: svixTimestamp,
				signature: svixSignature,
			},
			webhookSecret: RESEND_WEBHOOK_SECRET as string,
		});
	} catch {
		return json({ ok: false, error: 'Invalid webhook' }, 400);
	}

	if (event?.type !== 'email.received') {
		return json({ ok: true, ignored: true, type: event?.type ?? null }, 200);
	}

	try {
		const emailId = event.data?.email_id;
		if (!emailId) {
			return json({ ok: false, error: 'Missing email_id in event data' }, 400);
		}

		const inboundTo = event.data.to;
		const expectedTo = extractEmailAddress(EMAIL_FROM).toLowerCase();
		const normalizedTo = extractEmailAddress(Array.isArray(inboundTo) ? inboundTo[0] : inboundTo || '').toLowerCase();

		if (!normalizedTo || normalizedTo !== expectedTo) {
			return json({ ok: false, error: 'Email is not intended for this recipient' }, 400);
		}

		const fromAddress = extractEmailAddress(event.data.from || '');
		if (!fromAddress) {
			return json({ ok: false, error: 'Missing sender in event data' }, 400);
		}

		const job = { emailId, from: fromAddress, subject: event.data.subject || '' };

		await qstashClient.publishJSON({
			url: WORKER_URL as string,
			body: job,
			deduplicationId: emailId,
			retries: 3,
			flowControl: { key: 'resend-api', rate: 4, period: '1s' },
		});

		console.log('Queued inbound email job', { emailId, from: fromAddress, to: normalizedTo, subject: job.subject });

		return json({ ok: true, queued: true, type: event.type, emailId }, 202);
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Webhook processing failed';
		return json({ ok: false, error: message }, 500);
	}
}

export default { fetch: handler };
