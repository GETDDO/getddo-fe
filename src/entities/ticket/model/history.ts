import { z } from 'zod';

// spec T02 — TicketTransaction 유형. 지급·차감·반환·만료·회수 외에 관리자 정정(CORRECTION)도 이력으로 남는다
export const ticketTransactionTypeSchema = z.enum([
    'GRANT',
    'SPEND',
    'REFUND',
    'EXPIRE',
    'REVOKE',
    'CORRECTION',
]);

// 화면이 쓰는 원장 항목 — spec TicketTransaction에서 지갑·수량·사후 잔액·사유·시각과 연결 이벤트 ID를 받는다 (목업은 아직 eventId를 내리지 않는다)
export const ticketHistorySchema = z.object({
    id: z.string(),
    walletId: z.string(),
    transactionType: ticketTransactionTypeSchema,
    /** 지급·반환은 양수, 차감·만료·회수는 음수 */
    quantity: z.number().int(),
    /** 처리 직후 해당 지갑의 잔액 — 전체 합계가 아니다 */
    balanceAfter: z.number().int(),
    reason: z.string(),
    createdAt: z.iso.datetime(),
    /** 응모·반환이 연결된 이벤트 — spec TicketTransaction.eventId (없으면 null 또는 생략) */
    eventId: z.string().nullable().optional(),
});

export type TicketTransactionType = z.infer<typeof ticketTransactionTypeSchema>;
export type TicketHistory = z.infer<typeof ticketHistorySchema>;
