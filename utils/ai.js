import { ollama } from '../clients/ollama.client.js';
import { OLLAMA_API_KEY, OLLAMA_DEFAULT_MODEL, OLLAMA_SYSTEM_PROMPT, } from '../config/index.js';
import { ollama_models } from '../config/models.js';
import { executeAiToolCall, getAiTools } from '../tools/index.js';

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
	const tools = getAiTools();
	const messages = [
		{ role: 'system', content: OLLAMA_SYSTEM_PROMPT },
		{ role: 'user', content: body },
	];

	let response = await ollama.chat({
		model,
		messages,
		...(tools.length ? { tools } : {}),
		stream: false,
		think: true,
	});
	messages.push(response.message);

	while (true) {
		const toolCalls = response?.message?.tool_calls || [];
		if (!Array.isArray(toolCalls) || !toolCalls.length) {
			break;
		}

		for (const call of toolCalls) {
			const toolName = call?.function?.name || 'unknown_tool';
			try {
				const toolResult = await executeAiToolCall(call);
				messages.push({
					role: 'tool',
					tool_name: toolName,
					content: JSON.stringify(toolResult),
				});
			} catch (error) {
				const message = error instanceof Error ? error.message : 'Tool execution failed';
				messages.push({
					role: 'tool',
					tool_name: toolName,
					content: JSON.stringify({ error: message }),
				});
			}
		}

		response = await ollama.chat({
			model,
			messages,
			...(tools.length ? { tools } : {}),
			stream: false,
			think: true,
		});
		messages.push(response.message);
	}

	return {
		model,
		content: response?.message?.content || '',
		raw: response,
	};
}
