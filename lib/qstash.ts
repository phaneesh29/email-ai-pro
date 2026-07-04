import { Client, Receiver } from '@upstash/qstash';
import { QSTASH_CURRENT_SIGNING_KEY, QSTASH_NEXT_SIGNING_KEY, QSTASH_TOKEN } from './config.js';

export const qstashClient = new Client({ token: QSTASH_TOKEN as string });

export const qstashReceiver = new Receiver({
	currentSigningKey: QSTASH_CURRENT_SIGNING_KEY as string,
	nextSigningKey: QSTASH_NEXT_SIGNING_KEY as string,
});
