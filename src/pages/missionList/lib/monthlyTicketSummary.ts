import type { TicketHistory } from '@entities/ticket';

import { toKst } from '@shared/lib/date';

/** 불러온 이력 중 이번 달(KST 달력 기준)의 적립·사용 합계를 구한다 (표시용) */
export function summarizeMonthlyTickets(history: TicketHistory[], now: Date) {
    const current = toKst(now);
    const isThisMonth = (iso: string) => {
        const date = toKst(iso);
        return (
            date.getUTCFullYear() === current.getUTCFullYear() &&
            date.getUTCMonth() === current.getUTCMonth()
        );
    };

    return history
        .filter((item) => isThisMonth(item.createdAt))
        .reduce(
            (sum, item) =>
                item.quantity >= 0
                    ? { ...sum, earned: sum.earned + item.quantity }
                    : { ...sum, used: sum.used - item.quantity },
            { earned: 0, used: 0 },
        );
}
