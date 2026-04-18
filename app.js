import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { CORS_ORIGIN } from './config/index.js';
import { healthRouter } from './routes/health.routes.js';

const app = express();

const corsConfig = {
	origin: CORS_ORIGIN === '*' ? true : CORS_ORIGIN.split(',').map((v) => v.trim()),
};

app.disable('x-powered-by');
app.use(helmet());
app.use(cors(corsConfig));
app.use(express.json({ limit: '100kb' }));

app.use('/', healthRouter);

app.use((req, res) => {
	res.status(404).json({ ok: false, error: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use((err, _req, res, _next) => {
	const message = err instanceof Error ? err.message : 'Internal server error';
	res.status(500).json({ ok: false, error: message });
});

export { app };
