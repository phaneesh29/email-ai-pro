import { tool } from '@openai/agents';
import { marked } from 'marked';
import { z } from 'zod';
import { EMAIL_FROM } from '../config/index.js';
import { sendEmail } from '../utils/send_email.js';

function escapeHtml(value) {
	return String(value)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}

function getSenderDisplayName(fromValue) {
	if (!fromValue || typeof fromValue !== 'string') {
		return 'Billion Dollar YAAA';
	}

	const match = fromValue.match(/^([^<]+)</);
	return (match ? match[1] : fromValue).trim() || 'Billion Dollar YAAA';
}

async function renderEmailHtml({ headline, recipient_name, message, cta_text, cta_url, signature, triggered_by_email }) {
	const renderedContent = await marked.parse(message);
	const contentHtml = typeof renderedContent === 'string' ? renderedContent : await renderedContent;
	const safeHeadline = escapeHtml(headline);
	const safeRecipient = recipient_name ? escapeHtml(recipient_name) : '';
	const safeSignature = escapeHtml(signature || getSenderDisplayName(EMAIL_FROM));
	const safeCtaText = cta_text ? escapeHtml(cta_text) : '';
	const safeCtaUrl = cta_url ? escapeHtml(cta_url) : '';
	const safeTriggeredByEmail = triggered_by_email ? escapeHtml(triggered_by_email) : '';
	const greetingHtml = safeRecipient ? `<p style="margin:0 0 18px;">Hi ${safeRecipient},</p>` : '';
	const ctaHtml = safeCtaText && safeCtaUrl
		? `<div style="margin:28px 0 8px;"><a href="${safeCtaUrl}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600;">${safeCtaText}</a></div>`
		: '';
	const triggeredByHtml = safeTriggeredByEmail
		? `<div style="padding:0 36px 28px;color:#6b7280;font-size:12px;line-height:1.6;">Triggered by: ${safeTriggeredByEmail}</div>`
		: '';

	return `<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>${safeHeadline}</title>
	</head>
	<body style="margin:0;padding:24px;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#111827;">
		<div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:18px;overflow:hidden;box-shadow:0 20px 45px rgba(17,24,39,0.08);">
			<div style="padding:36px 36px 24px;background:linear-gradient(135deg,#111827 0%,#1f2937 100%);color:#ffffff;">
				<div style="font-size:12px;letter-spacing:0.16em;text-transform:uppercase;opacity:0.82;">Billion Dollar YAAA</div>
				<h1 style="margin:14px 0 0;font-size:30px;line-height:1.2;font-weight:700;">${safeHeadline}</h1>
			</div>
			<div style="padding:32px 36px 18px;font-size:16px;line-height:1.7;">
				${greetingHtml}
				${contentHtml}
				${ctaHtml}
				<p style="margin:28px 0 0;">Best,<br />${safeSignature}</p>
			</div>
			<div style="padding:18px 36px 28px;color:#6b7280;font-size:12px;line-height:1.6;border-top:1px solid #e5e7eb;">
				Sent via Billion Dollar YAAA (Yet Another AI Application).
			</div>
			${triggeredByHtml}
		</div>
	</body>
</html>`;
}

function createMailSenderTool({ triggeredByEmail } = {}) {
	return tool({
		name: 'mail_sender',
		description: 'Send a polished HTML email through the configured Resend account. Use this when the user explicitly asks to answer or send a message to a specific email address. Write attractive, professional SaaS-style copy in markdown for the message body, and this tool will convert it into branded HTML before sending.',
		parameters: z.object({
			to: z.string().email(),
			subject: z.string().min(1).max(180),
			headline: z.string().min(1).max(180),
			message: z.string().min(1).describe('Markdown email body written for the recipient.'),
			recipient_name: z.string().min(1).max(120).optional(),
			cta_text: z.string().min(1).max(80).optional(),
			cta_url: z.string().url().optional(),
			signature: z.string().min(1).max(120).optional(),
		}),
		execute: async ({ to, subject, headline, message, recipient_name, cta_text, cta_url, signature }) => {
			const html = await renderEmailHtml({
				headline,
				recipient_name,
				message,
				cta_text,
				cta_url,
				signature,
				triggered_by_email: triggeredByEmail,
			});

			const result = await sendEmail(to, subject, html);

			return {
				success: true,
				to,
				subject,
				headline,
				mailId: result?.id || null,
				triggeredByEmail: triggeredByEmail || null,
			};
		},
	});
}

export { createMailSenderTool };
