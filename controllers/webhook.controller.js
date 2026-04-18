import { EMAIL_FROM, RESEND_WEBHOOK_SECRET } from '../config/index.js';
import { resend } from '../clients/resend.client.js';
import { enqueueAiEmailJob } from '../queues/aiEmail.queue.js';

function extractEmailAddress(value) {
    if (!value || typeof value !== 'string') {
        return '';
    }

    const match = value.match(/<([^>]+)>/);
    return (match ? match[1] : value).trim();
}

export async function handleResendWebhook(req, res) {
    if (!RESEND_WEBHOOK_SECRET) {
        return res.status(500).json({ ok: false, error: 'Missing RESEND_WEBHOOK_SECRET' });
    }

    const payload = typeof req.body === 'string' ? req.body : '';
    const svixId = req.get('svix-id');
    const svixTimestamp = req.get('svix-timestamp');
    const svixSignature = req.get('svix-signature');

    if (!payload || !svixId || !svixTimestamp || !svixSignature) {
        return res.status(400).json({ ok: false, error: 'Invalid webhook headers or payload' });
    }

    let event;
    try {
        event = resend.webhooks.verify({
            payload,
            headers: {
                id: svixId,
                timestamp: svixTimestamp,
                signature: svixSignature,
            },
            webhookSecret: RESEND_WEBHOOK_SECRET,
        });
    } catch {
        return res.status(400).json({ ok: false, error: 'Invalid webhook' });
    }

    if (event?.type !== 'email.received') {
        return res.status(200).json({ ok: true, ignored: true, type: event?.type || null });
    }

    try {
        const emailId = event?.data?.email_id;
        if (!emailId) {
            return res.status(400).json({ ok: false, error: 'Missing email_id in event data' });
        }

        const { data: email, error } = await resend.emails.receiving.get(emailId);
        if (error) {
            throw new Error(error.message || 'Failed to fetch received email');
        }

        const inboundTo = email?.to;
        const expectedTo = extractEmailAddress(EMAIL_FROM).toLowerCase();
        const normalizedTo = extractEmailAddress(
            Array.isArray(inboundTo) ? inboundTo[0] : (inboundTo || '')
        ).toLowerCase();

        if (!normalizedTo || normalizedTo !== expectedTo) {
            return res.status(400).json({ ok: false, error: 'Email is not intended for this recipient' });
        }

        const prompt = email?.text || email?.html || '';
        const fromAddress = extractEmailAddress(email?.from || '');
        if (!fromAddress || !prompt) {
            return res.status(400).json({ ok: false, error: 'Missing sender or prompt in received email' });
        }

        await enqueueAiEmailJob({
            emailId,
            from: fromAddress,
            to: normalizedTo,
            subject: email?.subject || '',
            prompt,
            headers: email?.headers || {},
        });

        console.table([{
            eventType: event.type,
            emailId,
            from: fromAddress,
            to: normalizedTo,
            subject: email?.subject,
            promptLength: prompt.length,
            createdAt: event?.created_at || null,
        }]);

        return res.status(202).json({ ok: true, queued: true, type: event.type, emailId });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Webhook processing failed';
        return res.status(500).json({ ok: false, error: message });
    }
}
