import { ollamaWebTools, runOllamaWebTool } from './ollamaWeb.tool.js';

function parseToolArguments(rawArguments) {
	if (!rawArguments) {
		return {};
	}

	if (typeof rawArguments === 'string') {
		try {
			return JSON.parse(rawArguments);
		} catch {
			return {};
		}
	}

	if (typeof rawArguments === 'object') {
		return rawArguments;
	}

	return {};
}

function getAiTools() {
	return [...ollamaWebTools];
}

async function executeAiToolCall(call) {
	const name = call?.function?.name;
	if (!name) {
		throw new Error('Invalid tool call: missing function name');
	}

	const args = parseToolArguments(call?.function?.arguments);

	if (name === 'web_search' || name === 'web_fetch') {
		return runOllamaWebTool(name, args);
	}

	throw new Error(`Unsupported tool call: ${name}`);
}

export { getAiTools, executeAiToolCall };