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

// 화면이 쓰는 원장 항목 — spec TicketTransaction에서 지갑·수량·사후 잔액·사유·시각만 받는다 (연결 ID는 목업이 내리지 않는다)
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
});

export type TicketTransactionType = z.infer<typeof ticketTransactionTypeSchema>;
export type TicketHistory = z.infer<typeof ticketHistorySchema>;
