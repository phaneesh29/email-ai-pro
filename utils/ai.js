import OpenAI from 'openai';
import { Agent, run, setDefaultOpenAIClient, setTracingDisabled } from '@openai/agents';
import { OLLAMA_API_KEY, OLLAMA_DEFAULT_MODEL, OLLAMA_OPENAI_BASE_URL, OLLAMA_SYSTEM_PROMPT, } from '../config/index.js';
import { ollama_models } from '../config/models.js';
import { getAgentTools } from '../tools/index.js';

const DEFAULT_MODEL_KEY = 'ollama/gpt-oss:120b';
const OLLAMA_MODEL_MAP = Object.freeze(ollama_models);

const customClient = new OpenAI({
	baseURL: OLLAMA_OPENAI_BASE_URL,
	apiKey: OLLAMA_API_KEY || 'ollama',
});

setDefaultOpenAIClient(customClient);
setTracingDisabled(true);

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
	if (!body || typeof body !== 'string') {
		throw new Error('Invalid email body prompt');
	}

	const model = resolveModelFromSubject(subject);
	const agent = new Agent({
		name: 'Assistant',
		instructions: `${OLLAMA_SYSTEM_PROMPT}\nIf the user asks for latest/current/recent information, use tools when needed and cite fetched context clearly.`,
		model,
		tools: getAgentTools(),
	});

	const result = await run(agent, body, { maxTurns: 10 });
	const finalOutput = result?.finalOutput;
	const content = typeof finalOutput === 'string'
		? finalOutput
		: JSON.stringify(finalOutput ?? {}, null, 2);

	return {
		model,
		content,
		raw: result,
	};
}
