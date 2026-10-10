import { z } from 'zod';

// getddo-spec/05-api/entry.md 초안의 EntryReceipt — 접수·거절 두 상태만 존재한다
export const entryStatusSchema = z.enum(['ACCEPTED', 'REJECTED']);

// 응모 접수 결과 — 최종 접수 여부는 이 응답을 따른다 (화면에서 미리 확정하지 않는다)
// eventTitle은 목록에서 이벤트 이름을 보여주기 위해 서버가 함께 내려주는 필드다.
// 당첨 여부는 담기지 않는다 — 발표 전 당첨 정보는 비공개다 (docs/CONTEXT.md).
export const entrySchema = z.object({
    id: z.string(),
    eventId: z.string(),
    eventTitle: z.string(),
    /** 이번 응모로 요청한 응모권 수 */
    requestedTicketCount: z.number().int().nonnegative(),
    /** 이번 응모로 실제 차감된 응모권 수 */
    deductedTicketCount: z.number().int().nonnegative(),
    status: entryStatusSchema,
    requestedAt: z.iso.datetime(),
    acceptedAt: z.iso.datetime().nullable(),
    rejectionCode: z.string().nullable(),
    rejectionReason: z.string().nullable(),
});

// E03 EntryStatistics (getddo-spec/05-api/entry.md) — 당첨 확률은 계약에 없고 화면에도 노출하지 않는다
export const entryStatisticsSchema = z.object({
    eventId: z.string(),
    /** 접수 완료된 응모자 수(중복 제거) */
    participantCount: z.number().int().nonnegative(),
    /** 접수 완료 건의 차감 합계 — 반환을 빼지 않는다 */
    totalSpentTicketCount: z.number().int().nonnegative(),
    /** 내가 이 이벤트에 차감한 응모권 수 */
    mySpentTicketCount: z.number().int().nonnegative(),
    // 서버 시각은 UTC 또는 명시적 오프셋(+09:00 등)을 허용한다 (docs/CONTEXT.md)
    serverTime: z.iso.datetime({ offset: true }),
});

export type EntryStatistics = z.infer<typeof entryStatisticsSchema>;
export type EntryStatus = z.infer<typeof entryStatusSchema>;
export type Entry = z.infer<typeof entrySchema>;
