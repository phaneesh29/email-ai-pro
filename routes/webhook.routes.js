import express from 'express';
import { Router } from 'express';
import { handleResendWebhook } from '../controllers/webhook.controller.js';

const webhookRouter = Router();

webhookRouter.post('/resend', express.text({ type: '*/*' }), handleResendWebhook);

export { webhookRouter };
