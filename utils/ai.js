import { ollama } from '../clients/ollama.client.js';
import { OLLAMA_API_KEY, OLLAMA_DEFAULT_MODEL, OLLAMA_SYSTEM_PROMPT } from '../config/index.js';
import { ollama_models } from '../config/models.js';

const DEFAULT_MODEL_KEY = 'ollama/gpt-oss:120b';
const OLLAMA_MODEL_MAP = Object.freeze(ollama_models);

function resolveModelFromSubject(subject) {
	if (!subject || typeof subject !== 'string') {
		return OLLAMA_MODEL_MAP[DEFAULT_MODEL_KEY] || OLLAMA_DEFAULT_MODEL;
	}

	const trimmed = subject.trim();
	if (!trimmed) {
		return OLLAMA_MODEL_MAP[DEFAULT_MODEL_KEY] || OLLAMA_DEFAULT_MODEL;
	}

	const lower = trimmed.toLowerCase();
	const key = lower.startsWith('ollama/') ? lower : DEFAULT_MODEL_KEY;
	return OLLAMA_MODEL_MAP[key] || OLLAMA_MODEL_MAP[DEFAULT_MODEL_KEY] || OLLAMA_DEFAULT_MODEL;
}

export async function generateAiResponseFromEmail(subject, body) {
	if (!OLLAMA_API_KEY) {
		throw new Error('Missing OLLAMA_API_KEY');
	}

	if (!body || typeof body !== 'string') {
		throw new Error('Invalid email body prompt');
	}

	const model = resolveModelFromSubject(subject);
	const response = await ollama.chat({
		model,
		messages: [
			{ role: 'system', content: OLLAMA_SYSTEM_PROMPT },
			{ role: 'user', content: body },
		],
		stream: false,
	});

	return {
		model,
		content: response?.message?.content || '',
		raw: response,
	};
}
