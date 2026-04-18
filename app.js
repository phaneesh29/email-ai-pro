import express from 'express';
import helmet from 'helmet';
import { healthRouter } from './routes/health.routes.js';
import { webhookRouter } from './routes/webhook.routes.js';

const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use('/webhooks', webhookRouter);
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
