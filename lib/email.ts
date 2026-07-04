export function extractEmailAddress(value: string | null | undefined): string {
	if (!value || typeof value !== 'string') {
		return '';
	}

	const match = value.match(/<([^>]+)>/);
	return (match ? match[1] : value).trim();
}

export function escapeHtml(value: string): string {
	return String(value)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}

export function getReplySubject(subject: string | null | undefined): string {
	const baseSubject = subject && typeof subject === 'string' ? subject.trim() : 'Your request';
	return baseSubject.toLowerCase().startsWith('re:') ? baseSubject : `Re: ${baseSubject}`;
}
