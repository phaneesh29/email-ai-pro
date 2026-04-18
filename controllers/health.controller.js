import { NODE_ENV } from '../config/index.js';

export function getHealth(_req, res) {
	res.status(200).json({
		ok: true,
		environment: NODE_ENV,
		timestamp: new Date().toISOString(),
	});
}
