import { z } from 'zod';

export const ticketHistoryTypeSchema = z.enum(['earn', 'use', 'refund', 'expire', 'revoke']);

export const ticketHistorySchema = z.object({
    id: z.string(),
    type: ticketHistoryTypeSchema,
    /** 지급·반환은 양수, 차감·만료·회수는 음수 */
    amount: z.number().int(),
    reason: z.string(),
    createdAt: z.iso.datetime(),
});

export type TicketHistoryType = z.infer<typeof ticketHistoryTypeSchema>;
export type TicketHistory = z.infer<typeof ticketHistorySchema>;
