import "dotenv/config";

const NODE_ENV = process.env.NODE_ENV || "development";
const PORT = Number.parseInt(process.env.PORT || "3000", 10);
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET;
const EMAIL_FROM = process.env.EMAIL_FROM || "AI <ai@tsindia.org>";
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY;
const OLLAMA_HOST = process.env.OLLAMA_HOST || "https://ollama.com";
const OLLAMA_DEFAULT_MODEL = process.env.OLLAMA_DEFAULT_MODEL || "gpt-oss:120b";
const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

if (!RESEND_API_KEY) {
	throw new Error("Missing required environment variable: RESEND_API_KEY");
}

if (Number.isNaN(PORT) || PORT <= 0) {
	throw new Error("Invalid PORT environment variable");
}

export {
	NODE_ENV,
	PORT,
	RESEND_API_KEY,
	RESEND_WEBHOOK_SECRET,
	EMAIL_FROM,
	OLLAMA_API_KEY,
	OLLAMA_HOST,
	OLLAMA_DEFAULT_MODEL,
	REDIS_URL,
};