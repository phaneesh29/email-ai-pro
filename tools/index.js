import { tool } from '@openai/agents';
import { z } from 'zod';
import { runWebTool } from './web.tool.js';
import { horoscopeTool } from './horoscope.tool.js';
import { createMailSenderTool } from './mail_sender.tool.js';

const webSearch = tool({
	name: 'web_search',
	description: 'Search the public web for up-to-date information.',
	parameters: z.object({
		query: z.string().min(1),
		max_results: z.number().int().min(1).max(10).optional(),
	}),
	execute: async ({ query, max_results }) => {
		return runWebTool('web_search', { query, max_results });
	},
});

const webFetch = tool({
	name: 'web_fetch',
	description: 'Fetch and extract content from a public web page URL.',
	parameters: z.object({
		url: z.string().url(),
	}),
	execute: async ({ url }) => {
		return runWebTool('web_fetch', { url });
	},
});

function getAgentTools(options = {}) {
	return [webSearch, webFetch, horoscopeTool, createMailSenderTool(options)];
}

export { getAgentTools };
