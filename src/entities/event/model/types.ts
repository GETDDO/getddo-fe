import { z } from 'zod';

export const eventStatusSchema = z.enum(['upcoming', 'open', 'closed', 'drawn']);

// 서버 응답 스키마 — startsAt/endsAt은 UTC ISO 8601 문자열, 화면 표시 시 shared/lib/date의 KST 변환 사용
export const eventSchema = z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    bannerImageUrl: z.string().nullable(),
    startsAt: z.iso.datetime(),
    endsAt: z.iso.datetime(),
    status: eventStatusSchema,
    requiredTickets: z.number().int().nonnegative(),
    prizeName: z.string(),
    winnerCount: z.number().int().positive(),
    // 실시간 응모 현황 — CONTEXT.md: 당첨 확률은 노출 금지, 아래 지표까지만 표시 가능
    participantCount: z.number().int().nonnegative().nullable().optional(),
    usedTicketCount: z.number().int().nonnegative().nullable().optional(),
    myEntryCount: z.number().int().nonnegative().nullable().optional(),
});

export type EventStatus = z.infer<typeof eventStatusSchema>;
export type Event = z.infer<typeof eventSchema>;
