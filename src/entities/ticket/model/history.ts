import { z } from 'zod';

export const ticketHistoryTypeSchema = z.enum(['earn', 'use']);

export const ticketHistorySchema = z.object({
    id: z.string(),
    type: ticketHistoryTypeSchema,
    /** 지급은 양수, 차감은 음수 */
    amount: z.number().int(),
    reason: z.string(),
    createdAt: z.string(),
});

export type TicketHistoryType = z.infer<typeof ticketHistoryTypeSchema>;
export type TicketHistory = z.infer<typeof ticketHistorySchema>;
