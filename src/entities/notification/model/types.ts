import { z } from 'zod';

export const notificationSchema = z.object({
    id: z.string(),
    title: z.string(),
    body: z.string(),
    read: z.boolean(),
    createdAt: z.iso.datetime(),
});

export type Notification = z.infer<typeof notificationSchema>;
