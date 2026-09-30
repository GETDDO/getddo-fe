import { z } from 'zod';

export const entryStatusSchema = z.enum(['applied', 'cancelled']);

// 응모 접수 결과 — 최종 접수 여부는 이 응답을 따른다 (화면에서 미리 확정하지 않는다)
export const entrySchema = z.object({
    id: z.string(),
    eventId: z.string(),
    /** 이번 응모로 차감된 응모권 수 */
    ticketsUsed: z.number().int().nonnegative(),
    status: entryStatusSchema,
    createdAt: z.iso.datetime(),
});

export type EntryStatus = z.infer<typeof entryStatusSchema>;
export type Entry = z.infer<typeof entrySchema>;
