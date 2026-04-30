import IORedis from 'ioredis';
import { Worker } from 'bullmq';
import { marked } from 'marked';
import { REDIS_URL } from '../config/index.js';
import { aiEmailQueueName } from '../queues/aiEmail.queue.js';
import { generateAiResponseFromEmail } from '../utils/ai.js';
import { sendEmail } from '../utils/send_email.js';

function extractEmailAddress(value) {
	if (!value || typeof value !== 'string') {
		return '';
	}

	const match = value.match(/<([^>]+)>/);
	return (match ? match[1] : value).trim();
}

function escapeHtml(value) {
	return String(value)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}

function getReplySubject(subject) {
	const baseSubject = subject && typeof subject === 'string' ? subject.trim() : 'Your request';
	return baseSubject.toLowerCase().startsWith('re:') ? baseSubject : `Re: ${baseSubject}`;
}

const workerConnection = new IORedis(REDIS_URL, {
	maxRetriesPerRequest: null,
});

const worker = new Worker(
	aiEmailQueueName,
	async (job) => {
		const { emailId, from, subject, prompt } = job.data || {};
		const replyTo = extractEmailAddress(from);
		const replySubject = getReplySubject(subject);

		if (!replyTo) {
			throw new Error('Missing valid sender email in job payload');
		}

		try {
			if (!prompt || typeof prompt !== 'string') {
				throw new Error('Missing prompt in job payload');
			}

			const aiResult = await generateAiResponseFromEmail(subject, prompt, {
				triggeredByEmail: replyTo,
			});
			const markdownContent = aiResult.content || 'No response generated.';
			const renderedContent = marked.parse(markdownContent);
			const responseHtml = typeof renderedContent === 'string' ? renderedContent : await renderedContent;
			const replyHtml = `${responseHtml}<hr /><p><small>Answered by ${aiResult.model}</small></p>`;

			const mailResult = await sendEmail(replyTo, replySubject, replyHtml);

			console.log('Processing job', {
				id: job.id,
				name: job.name,
				emailId,
				replyTo,
				model: aiResult.model,
			});

			return {
				processed: true,
				emailId,
				replyTo,
				model: aiResult.model,
				mailId: mailResult?.id || null,
				processedAt: new Date().toISOString(),
			};
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to process AI request';
			const errorHtml = `<p>We could not complete your request.</p><p><strong>Error:</strong> ${escapeHtml(message)}</p>`;

			const errorMailResult = await sendEmail(replyTo, replySubject, errorHtml);

			return {
				processed: false,
				errorNotified: true,
				emailId,
				replyTo,
				error: message,
				mailId: errorMailResult?.id || null,
				processedAt: new Date().toISOString(),
			};
		}
	},
	{
		connection: workerConnection,
	}
);

worker.on('completed', (job, result) => {
	console.log('Job completed', {
		id: job.id,
		name: job.name,
		result,
	});
});

worker.on('failed', (job, err) => {
	console.error('Job failed', {
		id: job?.id,
		name: job?.name,
		error: err.message,
	});
});

async function shutdown(signal) {
	console.log(`Received ${signal}, shutting down worker.`);
	await worker.close();
	await workerConnection.quit();
	process.exit(0);
}

process.on('SIGINT', () => {
	void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
	void shutdown('SIGTERM');
});

console.log(`Worker started for queue: ${aiEmailQueueName}`);
