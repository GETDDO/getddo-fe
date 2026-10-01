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

/**
 * 내 응모 내역의 한 줄. 목록에서 이벤트 이름을 보여줘야 하는데
 * 이벤트를 건건이 다시 조회할 수 없으므로 서버가 제목을 함께 내려준다.
 * 당첨 여부는 담기지 않는다 — 발표 전 당첨 정보는 비공개다 (docs/CONTEXT.md).
 */
export const myEntrySchema = entrySchema.extend({
    eventTitle: z.string(),
});

export type EntryStatus = z.infer<typeof entryStatusSchema>;
export type Entry = z.infer<typeof entrySchema>;
export type MyEntry = z.infer<typeof myEntrySchema>;
