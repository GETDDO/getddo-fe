import { z } from 'zod';

// 관리자 이벤트 상태 — getddo-spec 05-api/event.md의 EventStatus 원문 (사용자용 단순화 enum과 별개)
export const adminEventStatusSchema = z.enum([
    'SCHEDULED',
    'OPEN',
    'CLOSED',
    'DRAW_CONFIRMED',
    'PUBLISHED',
    'CANCELED',
    'REDRAWING',
    'NO_ENTRANTS',
    'NO_ELIGIBLE_ENTRANTS',
]);

export const eventTypeSchema = z.enum(['NO_TICKET', 'TICKET']);
export const membershipRuleSchema = z.enum(['excellent', 'vip', 'vvip']);

export const adminPrizeSchema = z.object({
    id: z.string(),
    rank: z.number().int().min(1),
    name: z.string(),
    description: z.string().nullable(),
    imageUrl: z.string().nullable(),
    winnerCount: z.number().int().min(1),
});

// AE01/AE02 응답 — AdminEvent = EventDetail + 감사 필드 (spec 초안, 검토 대기)
export const adminEventSchema = z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    imageUrl: z.string().nullable(),
    imageKey: z.string().nullable(),
    eventType: eventTypeSchema,
    weightingEnabled: z.boolean(),
    maxTicketsPerUser: z.number().int().nullable(),
    membershipRule: membershipRuleSchema,
    startsAt: z.iso.datetime(),
    endsAt: z.iso.datetime(),
    status: adminEventStatusSchema,
    publicationScheduledAt: z.iso.datetime(),
    serverTime: z.iso.datetime(),
    prizes: z.array(adminPrizeSchema),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    canceledAt: z.iso.datetime().nullable(),
});

// AE03/AE04 요청 본문 — EventWriteRequest (spec 초안). 응답과 달리 쓰기용이라 Zod 검증 없이 타입만 둔다
export interface PrizeWrite {
    id?: string;
    rank: number;
    name: string;
    winnerCount: number;
    description: string | null;
    imageKey: string | null;
}

export interface EventWriteRequest {
    title: string;
    description: string;
    imageKey: string | null;
    eventType: EventType;
    weightingEnabled: boolean;
    /** 미사용 null, 미가중치 1, 일반 가중치 5, 월말 소진용 null — 조합 검증은 서버가 한다 */
    maxTicketsPerUser: number | null;
    membershipRule: MembershipRule;
    startsAt: string;
    endsAt: string;
    prizes: PrizeWrite[];
}

// AE08 상태 운영 응답
export const eventOperationResultSchema = z.object({
    eventId: z.string(),
    previousStatus: adminEventStatusSchema,
    status: adminEventStatusSchema,
    refundedTicketCount: z.number().int(),
    processedAt: z.iso.datetime(),
});

export type AdminEventStatus = z.infer<typeof adminEventStatusSchema>;
export type EventType = z.infer<typeof eventTypeSchema>;
export type MembershipRule = z.infer<typeof membershipRuleSchema>;
export type AdminPrize = z.infer<typeof adminPrizeSchema>;
export type AdminEvent = z.infer<typeof adminEventSchema>;
export type EventOperationResult = z.infer<typeof eventOperationResultSchema>;
