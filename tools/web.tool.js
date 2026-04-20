const DEFAULT_USER_AGENT =
	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

function extractString(value) {
	if (typeof value !== 'string') {
		return '';
	}

	return value.trim();
}

function extractSearchQuery(args) {
	if (!args || typeof args !== 'object') {
		return '';
	}

	const directCandidates = [
		args.query,
		args.q,
		args.search_query,
		args.searchQuery,
		args.input,
		args.text,
		args.prompt,
	];

	for (const candidate of directCandidates) {
		const normalized = extractString(candidate);
		if (normalized) {
			return normalized;
		}
	}

	if (args.query && typeof args.query === 'object') {
		const nested = extractString(args.query.query || args.query.text || args.query.input);
		if (nested) {
			return nested;
		}
	}

	return '';
}

function extractFetchUrl(args) {
	if (!args || typeof args !== 'object') {
		return '';
	}

	const candidates = [args.url, args.link, args.href, args.uri, args.input];
	for (const candidate of candidates) {
		const normalized = extractString(candidate);
		if (normalized) {
			return normalized;
		}
	}

	return '';
}

function stripHtml(input) {
	return input
		.replace(/<[^>]*>/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/\s+/g, ' ')
		.trim();
}

async function performWebSearch(query, maxResults = 5) {
	const endpoint = `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
	const response = await fetch(endpoint, {
		headers: {
			'User-Agent': DEFAULT_USER_AGENT,
		},
	});

	if (!response.ok) {
		throw new Error(`Search failed with status ${response.status}`);
	}

	const html = await response.text();
	const resultPattern = /<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gim;
	const results = [];
	let match;

	while ((match = resultPattern.exec(html)) && results.length < maxResults) {
		const url = extractString(match[1]);
		const title = stripHtml(match[2] || '');
		if (!url || !title) {
			continue;
		}

		results.push({ title, url });
	}

	return {
		query,
		results,
	};
}

async function runWebTool(name, args) {
	if (name === 'web_search') {
		const query = extractSearchQuery(args);
		const maxResultsRaw = args?.max_results;
		if (!query) {
			throw new Error('Missing required argument: query');
		}

		const normalizedMaxResults = Number.isFinite(maxResultsRaw)
			? Math.max(1, Math.min(10, Number(maxResultsRaw)))
			: 5;

		const result = await performWebSearch(query, normalizedMaxResults);
		const maxResults = Number.isFinite(maxResultsRaw)
			? Math.max(1, Math.min(10, Number(maxResultsRaw)))
			: null;

		if (!maxResults) {
			return result;
		}

		if (Array.isArray(result)) {
			return result.slice(0, maxResults);
		}

		if (result && Array.isArray(result.results)) {
			return {
				...result,
				results: result.results.slice(0, maxResults),
			};
		}

		return result;
	}

	if (name === 'web_fetch') {
		const url = extractFetchUrl(args);
		if (!url) {
			throw new Error('Missing required argument: url');
		}

		const response = await fetch(url, {
			headers: {
				'User-Agent': DEFAULT_USER_AGENT,
			},
		});

		if (!response.ok) {
			throw new Error(`Fetch failed with status ${response.status}`);
		}

		const contentType = response.headers.get('content-type') || 'unknown';
		const content = await response.text();

		return {
			url,
			status: response.status,
			contentType,
			content: content.slice(0, 12000),
		};
	}

	throw new Error(`Unknown web tool: ${name}`);
}

export { runWebTool };
