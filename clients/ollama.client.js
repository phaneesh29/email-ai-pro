import { Ollama } from 'ollama';
import { OLLAMA_API_KEY, OLLAMA_HOST } from '../config/index.js';

function createOllamaClient() {
	const headers = OLLAMA_API_KEY ? { Authorization: `Bearer ${OLLAMA_API_KEY}` } : undefined;

	return new Ollama({
		host: OLLAMA_HOST,
		headers,
	});
}

const ollama = createOllamaClient();

export { ollama };
