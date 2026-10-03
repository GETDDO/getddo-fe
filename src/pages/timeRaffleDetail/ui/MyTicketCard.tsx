import { Ticket } from 'lucide-react';

import type { Event } from '@entities/event';

import { useTicketBalance } from '@entities/ticket';
import { formatNumber } from '@shared/lib/format';

export function MyTicketCard({ event }: { event: Event }) {
    const { data: ticket } = useTicketBalance();

    const entryCount = event.myEntryCount ?? 0;
    // 한 번에 여러 장을 쓸 수 있어 횟수 × 차감량으로는 실제 사용량이 나오지 않는다
    const usedTickets = event.myTicketCount ?? entryCount * event.requiredTickets;
    const rows = [
        {
            label: '보유 응모권',
            value: ticket ? `${formatNumber(ticket.balance)} 장` : '-',
        },
        { label: '이번 이벤트 응모 횟수', value: `${formatNumber(entryCount)} 회` },
        {
            label: '사용된 응모권',
            value: `${formatNumber(usedTickets)} 장`,
        },
    ];

    return (
        <section className="bg-surface-page border-border-default flex flex-col gap-4 rounded-2xl border p-5">
            <div className="flex items-center justify-between">
                <h2 className="text-subhead text-fg-primary">내 응모권 현황</h2>
                <Ticket className="text-fg-primary size-6" />
            </div>
            <dl className="flex flex-col gap-3">
                {rows.map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between">
                        <dt className="text-body text-fg-secondary">{label}</dt>
                        <dd className="text-body-bold text-fg-primary">{value}</dd>
                    </div>
                ))}
            </dl>
        </section>
    );
}
