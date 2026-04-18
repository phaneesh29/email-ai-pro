import { Resend } from 'resend';
import { EMAIL_FROM, RESEND_API_KEY } from '../config/index.js';

const resend = new Resend(RESEND_API_KEY);

export async function sendEmail(to, subject, html) {
	if (!to || typeof to !== 'string') {
		throw new Error('Invalid recipient email');
	}

	if (!subject || typeof subject !== 'string') {
		throw new Error('Invalid email subject');
	}

	if (!html || typeof html !== 'string') {
		throw new Error('Invalid email html body');
	}

	const { data, error } = await resend.emails.send({
		from: EMAIL_FROM,
		to: [to],
		subject,
		html,
	});

	if (error) {
		throw new Error(error.message || 'Failed to send email via Resend');
	}

	return data;
}
