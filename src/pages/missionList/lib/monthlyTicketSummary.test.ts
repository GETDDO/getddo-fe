import type { TicketHistory } from '@entities/ticket';

import { summarizeMonthlyTickets } from './monthlyTicketSummary';

const item = (id: string, amount: number, createdAt: string): TicketHistory => ({
    id,
    type: amount >= 0 ? 'earn' : 'use',
    amount,
    reason: '테스트',
    createdAt,
});

describe('summarizeMonthlyTickets', () => {
    it('이번 달(KST) 적립과 사용을 나눠 합산한다', () => {
        const history = [
            item('a', 1, '2026-09-17T01:00:00Z'),
            item('b', -3, '2026-09-16T09:30:00Z'),
            item('c', 2, '2026-09-20T00:00:00Z'),
        ];
        expect(summarizeMonthlyTickets(history, new Date('2026-09-27T00:00:00Z'))).toEqual({
            earned: 3,
            used: 3,
        });
    });

    it('KST로 다음 달이 된 이력은 이번 달에서 제외한다', () => {
        // 2026-08-31T16:00Z = 2026-09-01 01:00 KST
        const history = [
            item('a', 1, '2026-08-31T16:00:00Z'),
            item('b', 1, '2026-08-31T14:00:00Z'),
        ];
        expect(summarizeMonthlyTickets(history, new Date('2026-09-10T00:00:00Z'))).toEqual({
            earned: 1,
            used: 0,
        });
    });
});
