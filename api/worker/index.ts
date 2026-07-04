import { marked } from 'marked';
import { generateAiReply } from '../../lib/ai.js';
import { escapeHtml, extractEmailAddress, getReplySubject } from '../../lib/email.js';
import { emailJobSchema } from '../../lib/job.js';
import { qstashReceiver } from '../../lib/qstash.js';
import { resend, sendEmail } from '../../lib/resend.js';

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

	const body = await req.text();
	const signature = req.headers.get('upstash-signature');

	try {
		const isValid = await qstashReceiver.verify({ signature: signature ?? '', body });
		if (!isValid) {
			throw new Error('Invalid signature');
		}
	} catch {
		return json({ ok: false, error: 'Invalid QStash signature' }, 401);
	}

	const parsed = emailJobSchema.safeParse(JSON.parse(body));
	if (!parsed.success) {
		return json({ ok: false, error: 'Invalid job payload' }, 400);
	}

	const { emailId, from, subject } = parsed.data;
	const replyTo = extractEmailAddress(from);
	const replySubject = getReplySubject(subject);

	if (!replyTo) {
		return json({ ok: false, error: 'Missing valid sender email in job payload' }, 400);
	}

	try {
		const { data: email, error } = await resend.emails.receiving.get(emailId);
		if (error || !email) {
			throw new Error(error?.message || 'Failed to fetch received email');
		}

		const prompt = email.text || email.html || '';
		if (!prompt) {
			throw new Error('Missing prompt in received email');
		}

		const aiResult = await generateAiReply(prompt, replyTo);
		const renderedContent = await marked.parse(aiResult.content || 'No response generated.');
		const replyHtml = `${renderedContent}<hr /><p><small>Answered by ${aiResult.model}</small></p>`;

		const mailResult = await sendEmail(replyTo, replySubject, replyHtml);

		console.log('Processed job', { emailId, replyTo, model: aiResult.model });

		return json(
			{ ok: true, processed: true, emailId, replyTo, model: aiResult.model, mailId: mailResult?.id ?? null },
			200
		);
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Failed to process AI request';
		const errorHtml = `<p>We could not complete your request.</p><p><strong>Error:</strong> ${escapeHtml(message)}</p>`;

		try {
			const errorMailResult = await sendEmail(replyTo, replySubject, errorHtml);
			return json(
				{ ok: false, processed: false, errorNotified: true, emailId, replyTo, error: message, mailId: errorMailResult?.id ?? null },
				200
			);
		} catch {
			return json({ ok: false, error: message }, 500);
		}
	}
}

export default { fetch: handler };
