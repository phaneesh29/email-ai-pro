import { mistral } from '@ai-sdk/mistral';
import { ToolLoopAgent } from 'ai';
import { SYSTEM_PROMPT } from './config.js';
import { webExtract, webSearch } from './tools.js';

const MODEL = 'codestral-2508';

const agent = new ToolLoopAgent({
	model: mistral(MODEL),
	instructions: SYSTEM_PROMPT,
	tools: { web_search: webSearch, web_extract: webExtract },
});

export async function generateAiReply(prompt: string, triggeredByEmail: string): Promise<{ model: string; content: string }> {
	if (!prompt || typeof prompt !== 'string') {
		throw new Error('Invalid prompt');
	}

	const contextualPrompt = triggeredByEmail ? `(Message received from: ${triggeredByEmail})\n\n${prompt}` : prompt;
	const result = await agent.generate({ prompt: contextualPrompt });

	return { model: MODEL, content: result.text ?? '' };
}
