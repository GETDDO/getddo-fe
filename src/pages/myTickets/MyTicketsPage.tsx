import { Ticket } from 'lucide-react';

import {
    TICKET_GRADE_LABEL,
    TicketHistoryItem,
    useMyTickets,
    useTicketHistories,
} from '@entities/ticket';
import { formatKst, kstNextMonthStart } from '@shared/lib/date';
import { formatNumber } from '@shared/lib/format';
import { useVirtualClock } from '@shared/lib/virtualClock';

export function MyTicketsPage() {
    const { data: balance, isPending: balancePending, isError: balanceError } = useMyTickets();
    const {
        data: history,
        isPending: historyPending,
        isError: historyError,
    } = useTicketHistories();

    // 지급분의 만료 시각은 다음 달 1일 00:00 KST (getddo-spec ticket.md)
    const clock = useVirtualClock();
    const expiryAt = kstNextMonthStart(clock.now());
    const expiryLabel = `${formatKst(expiryAt, { month: 'long', day: 'numeric' })} 00:00(KST)`;
    // 보유 묶음 중 만료 시각이 다음 달 경계에 닿는 장수의 합 — "expiryLabel에 N장 만료 예정" 문구의 수치.
    // holdings는 사용 가능분만 오르므로 상태 검사 없이 만료 시각만 비교한다
    const expiringThisMonth =
        balance?.holdings
            .filter((h) => new Date(h.expiresAt).getTime() <= expiryAt.getTime())
            .reduce((sum, h) => sum + h.count, 0) ?? 0;
    const sortedHistory = [...(history ?? [])].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
    );

    return (
        <main className="mx-auto flex w-full max-w-312 flex-col gap-10 px-6 pt-20 pb-28">
            <h1 className="text-title-1 text-fg-primary">내 응모권</h1>

            <section className="bg-surface-page border-border-default flex flex-col gap-4 rounded-2xl border p-5">
                <div className="flex items-center justify-between">
                    <h2 className="text-subhead text-fg-primary">보유 응모권</h2>
                    <Ticket className="text-fg-primary size-6" />
                </div>
                {balancePending && <p className="text-body-sm text-fg-tertiary">불러오는 중…</p>}
                {balanceError && (
                    <p className="text-destructive text-body-sm">
                        응모권 잔액을 불러오지 못했습니다.
                    </p>
                )}
                {balance && (
                    <div className="flex flex-col gap-1">
                        <p className="text-display text-fg-primary">
                            {formatNumber(balance.availableCount)}
                            <span className="text-title-3"> 장</span>
                        </p>
                        <p className="text-body-sm text-fg-secondary">
                            {TICKET_GRADE_LABEL.BRONZE} {formatNumber(balance.countByGrade.BRONZE)}
                            장 · {TICKET_GRADE_LABEL.SILVER}{' '}
                            {formatNumber(balance.countByGrade.SILVER)}장 ·{' '}
                            {TICKET_GRADE_LABEL.GOLD} {formatNumber(balance.countByGrade.GOLD)}장
                        </p>
                        {expiringThisMonth > 0 && (
                            <p className="text-body-sm text-fg-secondary">
                                {expiryLabel}에 {formatNumber(expiringThisMonth)}장 만료 예정
                            </p>
                        )}
                    </div>
                )}
            </section>

            <section className="flex flex-col gap-2">
                <h2 className="text-subhead text-fg-primary">응모권 내역</h2>
                <p className="text-body-sm text-fg-tertiary">지급·사용·반환·만료가 모두 기록돼요</p>
                {historyPending && <p className="text-body-sm text-fg-tertiary">불러오는 중…</p>}
                {historyError && (
                    <p className="text-destructive text-body-sm">
                        응모권 내역을 불러오지 못했습니다.
                    </p>
                )}
                {!historyPending && !historyError && sortedHistory.length === 0 && (
                    <p className="text-fg-tertiary text-body-sm py-6">응모권 내역이 없습니다.</p>
                )}
                {sortedHistory.length > 0 && (
                    <ul className="divide-border-default divide-y">
                        {sortedHistory.map((item) => (
                            <TicketHistoryItem key={item.id} history={item} />
                        ))}
                    </ul>
                )}
            </section>
        </main>
    );
}
