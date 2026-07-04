import { tool } from '@openai/agents';
import { marked } from 'marked';
import { z } from 'zod';
import { BRAND_NAME, EMAIL_FROM } from '../config/index.js';
import { sendEmail } from '../utils/send_email.js';

function esc(value) {
	return String(value)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}


function displayName(from) {
	if (!from || typeof from !== 'string') return BRAND_NAME;
	const match = from.match(/^([^<]+)</);
	return (match ? match[1] : from).trim() || BRAND_NAME;
}


async function renderHtml({ headline, recipient_name, message, cta_text, cta_url, signature, triggered_by_email }) {
	const body = await marked.parse(message);
	const h = esc(headline);
	const sig = esc(signature || displayName(EMAIL_FROM));

	const greeting = recipient_name ? `<p style="margin:0 0 18px">Hi ${esc(recipient_name)},</p>` : '';

	const cta = cta_text && cta_url
		? `<div style="margin:28px 0 8px"><a href="${esc(cta_url)}" style="display:inline-block;background:#111827;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600">${esc(cta_text)}</a></div>`
		: '';

	const trigger = triggered_by_email
		? `<div style="padding:0 36px 28px;color:#6b7280;font-size:12px;line-height:1.6">Triggered by: ${esc(triggered_by_email)}</div>`
		: '';

	return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>${h}</title></head>
<body style="margin:0;padding:24px;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#111827">
<div style="max-width:680px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:18px;overflow:hidden;box-shadow:0 20px 45px rgba(17,24,39,.08)">
	<div style="padding:36px 36px 24px;background:linear-gradient(135deg,#111827,#1f2937);color:#fff">
		<div style="font-size:12px;letter-spacing:.16em;text-transform:uppercase;opacity:.82">${BRAND_NAME}</div>
		<h1 style="margin:14px 0 0;font-size:30px;line-height:1.2;font-weight:700">${h}</h1>
	</div>
	<div style="padding:32px 36px 18px;font-size:16px;line-height:1.7">
		${greeting}${body}${cta}
		<p style="margin:28px 0 0">Best,<br/>${sig}</p>
	</div>
	<div style="padding:18px 36px 28px;color:#6b7280;font-size:12px;line-height:1.6;border-top:1px solid #e5e7eb">
		Sent via ${BRAND_NAME} (Yet Another AI Application).
	</div>
	${trigger}
</div>
</body>
</html>`;
}


function createMailSenderTool({ triggeredByEmail } = {}) {
	return tool({
		name: 'mail_sender',
		description: 'Send branded HTML email via Resend. Use when user asks to send/reply to a specific email. Write markdown body; tool converts to branded HTML.',
		parameters: z.object({
			to: z.email(),
			subject: z.string().min(1).max(180),
			headline: z.string().min(1).max(180),
			message: z.string().min(1).describe('Markdown email body written for the recipient.'),
			recipient_name: z.string().min(1).max(120).optional(),
			cta_text: z.string().min(1).max(80).optional(),
			cta_url: z.string().url().optional(),
			signature: z.string().min(1).max(120).optional(),
		}),
		execute: async ({ to, subject, headline, message, recipient_name, cta_text, cta_url, signature }) => {
			try {
				const html = await renderHtml({ headline, recipient_name, message, cta_text, cta_url, signature, triggered_by_email: triggeredByEmail });
				const result = await sendEmail(to, subject, html);

				return { success: true, to, subject, headline, mailId: result?.id ?? null, triggeredByEmail: triggeredByEmail ?? null };
			} catch (err) {
				return { success: false, error: err.message || 'Failed to send email' };
			}
		},
	});
}

export { createMailSenderTool };
