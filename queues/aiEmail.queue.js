import IORedis from 'ioredis';
import { Queue } from 'bullmq';
import { REDIS_URL } from '../config/index.js';

const aiEmailQueueName = 'ai-email-jobs';

const queueConnection = new IORedis(REDIS_URL, {
	maxRetriesPerRequest: null,
});

const aiEmailQueue = new Queue(aiEmailQueueName, {
	connection: queueConnection,
	defaultJobOptions: {
		attempts: 3,
		removeOnComplete: true,
		removeOnFail: 100,
		backoff: {
			type: 'exponential',
			delay: 2000,
		},
	},
});

async function enqueueAiEmailJob(jobData) {
	const jobId = jobData?.emailId || undefined;

	return aiEmailQueue.add('process-inbound-email', jobData, {
		jobId,
	});
}

export { aiEmailQueue, aiEmailQueueName, queueConnection, enqueueAiEmailJob };
