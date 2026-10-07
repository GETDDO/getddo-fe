import { z } from 'zod';

// spec T01 — TicketWallet. 월 지급분은 지갑 단위로 나뉘고 expiryMonth 다음 달 1일 00:00 KST에 만료한다 (getddo-spec ticket.md 초안)
export const ticketWalletSchema = z.object({
    id: z.string(),
    /** 이 지갑이 만료되는 월(YYYY-MM) — 만료 일시는 expiresAt */
    expiryMonth: z.string(),
    validFrom: z.iso.datetime(),
    expiresAt: z.iso.datetime(),
    balance: z.number().int().nonnegative(),
    status: z.enum(['ACTIVE', 'EXPIRED']),
});

// spec T01 — MyWallets: 사용 가능 합계 + 지갑 목록 + 서버 시각
export const myWalletsSchema = z.object({
    availableBalance: z.number().int().nonnegative(),
    wallets: z.array(ticketWalletSchema),
    serverTime: z.iso.datetime(),
});

export type TicketWallet = z.infer<typeof ticketWalletSchema>;
export type MyWallets = z.infer<typeof myWalletsSchema>;
