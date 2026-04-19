import { ollama } from '../clients/ollama.client.js';

const ollamaWebTools = [
	{
		type: 'function',
		function: {
			name: 'web_search',
			description: 'Search the public web for up-to-date information.',
			parameters: {
				type: 'object',
				required: ['query'],
				properties: {
					query: { type: 'string', description: 'Search query string.' },
					max_results: {
						type: 'number',
						description: 'Optional maximum number of results to keep.',
					},
				},
			},
		},
	},
	{
		type: 'function',
		function: {
			name: 'web_fetch',
			description: 'Fetch and extract content from a public web page URL.',
			parameters: {
				type: 'object',
				required: ['url'],
				properties: {
					url: { type: 'string', description: 'Absolute URL to fetch.' },
				},
			},
		},
	},
];

async function runOllamaWebTool(name, args) {
	if (name === 'web_search') {
		const query = args?.query;
		const maxResultsRaw = args?.max_results;
		if (!query || typeof query !== 'string') {
			throw new Error('Missing required argument: query');
		}

		if (typeof ollama.webSearch !== 'function') {
			throw new Error('ollama.webSearch is not available in current SDK/runtime');
		}

		const result = await ollama.webSearch(query);
		const maxResults = Number.isFinite(maxResultsRaw)
			? Math.max(1, Math.min(10, Number(maxResultsRaw)))
			: null;

		if (!maxResults || !Array.isArray(result)) {
			return result;
		}

		return result.slice(0, maxResults);
	}

	if (name === 'web_fetch') {
		const url = args?.url;
		if (!url || typeof url !== 'string') {
			throw new Error('Missing required argument: url');
		}

		if (typeof ollama.webFetch !== 'function') {
			throw new Error('ollama.webFetch is not available in current SDK/runtime');
		}

		return ollama.webFetch(url);
	}

	throw new Error(`Unknown web tool: ${name}`);
}

export { ollamaWebTools, runOllamaWebTool };