import { z } from 'zod';

export const emailJobSchema = z.object({
	emailId: z.string().min(1),
	from: z.string().min(1),
	subject: z.string().default(''),
});

export type EmailJob = z.infer<typeof emailJobSchema>;
