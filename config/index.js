import "dotenv/config";

const NODE_ENV = process.env.NODE_ENV || "development";
const PORT = Number.parseInt(process.env.PORT || "3000", 10);
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || "AI <ai@tsindia.org>";
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

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
	EMAIL_FROM,
	CORS_ORIGIN,
};