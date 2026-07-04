import { tavily } from '@tavily/core';
import { tool } from 'ai';
import { z } from 'zod';
import { TAVILY_API_KEY } from './config.js';

const tavilyClient = tavily({ apiKey: TAVILY_API_KEY as string });

export const webSearch = tool({
	description: 'Search the web for current information, news, prices, docs, or facts.',
	inputSchema: z.object({
		query: z.string().min(1),
		maxResults: z.number().int().min(1).max(10).optional(),
	}),
	execute: async ({ query, maxResults }) => {
		const result = await tavilyClient.search(query, { maxResults: maxResults ?? 5 });
		return {
			answer: result.answer ?? null,
			results: result.results.map((r) => ({ title: r.title, url: r.url, content: r.content })),
		};
	},
});

export const webExtract = tool({
	description: 'Fetch and extract the readable content of one or more URLs.',
	inputSchema: z.object({
		urls: z.array(z.string().url()).min(1).max(5),
	}),
	execute: async ({ urls }) => {
		const result = await tavilyClient.extract(urls, { format: 'markdown' });
		return {
			results: result.results.map((r) => ({ url: r.url, title: r.title, content: r.rawContent })),
			failed: result.failedResults.map((r) => ({ url: r.url, error: r.error })),
		};
	},
});
