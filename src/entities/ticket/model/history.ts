import { z } from 'zod';

import { ticketGradeSchema } from './types';

// spec T02 — TicketHistory.operationType. 회수(REVOKE)는 이번 버전 처리 유형에서 제외다
// (getddo-spec 05-api/ticket.md, 도메인 규칙 "응모권 회수 제외")
export const ticketOperationTypeSchema = z.enum(['GRANT', 'USE', 'REFUND', 'EXPIRE', 'CORRECTION']);

// spec T02 — 처리가 끝난 직후 응모권의 상태
export const ticketStatusSchema = z.enum(['AVAILABLE', 'RETURNED', 'SPENT', 'EXPIRED']);

// spec T02 — TicketHistory는 응모권 한 장의 처리 한 번이라 수량·누계 필드가 없다.
// 한 응모에 여러 장을 쓰면 장마다 USE 이력이 생기고 같은 eventEntryId를 가진다.
// originalUseHistoryId는 REFUND가 되돌리는 원본 USE 이력, correctedHistoryId는 CORRECTION이 정정하는 과거 이력이다
export const ticketHistorySchema = z.object({
    id: z.string(),
    ticketId: z.string(),
    operationType: ticketOperationTypeSchema,
    grade: ticketGradeSchema,
    status: ticketStatusSchema,
    expiresAt: z.iso.datetime(),
    reason: z.string(),
    createdAt: z.iso.datetime(),
    // 연결된 원본 행위 — 없으면 null 또는 생략
    eventId: z.string().nullish(),
    eventEntryId: z.string().nullish(),
    missionId: z.string().nullish(),
    gameId: z.string().nullish(),
    attendanceDate: z.string().nullish(),
    originalUseHistoryId: z.string().nullish(),
    correctedHistoryId: z.string().nullish(),
});

export type TicketOperationType = z.infer<typeof ticketOperationTypeSchema>;
export type TicketStatus = z.infer<typeof ticketStatusSchema>;
export type TicketHistory = z.infer<typeof ticketHistorySchema>;
