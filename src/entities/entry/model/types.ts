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

export type EntryStatus = z.infer<typeof entryStatusSchema>;
export type Entry = z.infer<typeof entrySchema>;
