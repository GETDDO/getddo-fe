import { z } from 'zod';

// getddo-spec/05-api/notification.md N01~N03 확정 계약 기준
export const notificationSchema = z.object({
    id: z.string(),
    title: z.string(),
    body: z.string(),
    createdAt: z.iso.datetime(),
    isRead: z.boolean(),
    eventId: z.string().nullable(),
    linkUrl: z.string().nullable(),
});

export const notificationCursorSchema = z.object({
    items: z.array(notificationSchema),
    nextCursor: z.string().nullable(),
    totalElements: z.number(),
});

export const notificationReadResultSchema = z.object({
    id: z.string(),
    isRead: z.literal(true),
});

export type Notification = z.infer<typeof notificationSchema>;
export type NotificationCursor = z.infer<typeof notificationCursorSchema>;
