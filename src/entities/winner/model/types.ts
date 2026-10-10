import { z } from 'zod';

// getddo-spec 05-api/drawing.md — 당첨 취소·공개 명단 갱신 DTO (검토 대기 초안)

// AD05 응답. status는 연결된 재추첨 실행의 현재 상태다
export const awardCancellationResultSchema = z.object({
    cancellationId: z.string(),
    canceledDrawResultId: z.string(),
    replacementDrawRunId: z.string(),
    status: z.enum(['PREPARING', 'READY', 'RUNNING', 'CONFIRMED', 'FAILED']),
    canceledAt: z.iso.datetime(),
});

// AD06 응답
export const publicationUpdateResultSchema = z.object({
    eventId: z.string(),
    publicationId: z.string(),
    drawRunId: z.string(),
    revision: z.number().int(),
    publishedAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    updatedBy: z.string(),
});

// AD07 항목 — 공개 버전 간 변경 대상의 전후 정보
export const publicListChangeSchema = z.object({
    id: z.string(),
    publicationId: z.string(),
    revision: z.number().int(),
    drawRunId: z.string(),
    reason: z.string(),
    confirmedBy: z.string(),
    confirmedAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    changes: z.array(
        z.object({
            prizeId: z.string(),
            slotNumber: z.number().int(),
            beforeUserId: z.string().nullable(),
            afterUserId: z.string().nullable(),
        }),
    ),
});

export type AwardCancellationResult = z.infer<typeof awardCancellationResultSchema>;
export type PublicationUpdateResult = z.infer<typeof publicationUpdateResultSchema>;
export type PublicListChange = z.infer<typeof publicListChangeSchema>;
