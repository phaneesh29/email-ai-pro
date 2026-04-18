import { app } from './app.js';
import { PORT } from './config/index.js';

const server = app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});

function shutdown(signal) {
	console.log(`Received ${signal}, shutting down gracefully.`);
	server.close(() => {
		console.log('HTTP server closed.');
		process.exit(0);
	});
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
