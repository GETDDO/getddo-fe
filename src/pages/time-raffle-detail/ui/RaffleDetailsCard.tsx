import type { Event } from '@entities/event';

import { useTicketBalance } from '@entities/ticket';
import { KST_HOUR_MINUTE, formatKst } from '@shared/lib/date';
import { formatNumber } from '@shared/lib/format';

export function RaffleDetailsCard({ event }: { event: Event }) {
    const { data: ticket } = useTicketBalance();

    const detail = event.raffleDetail;
    const entryCount = event.myEntryCount ?? 0;
    const paragraphs = detail?.paragraphs ?? [event.description];

    // 응모 1건당 requiredTickets장이 차감되므로, 총 차감량을 나누면 응모 건수가 된다
    const entryTotal =
        event.usedTicketCount != null && event.requiredTickets > 0
            ? event.usedTicketCount / event.requiredTickets
            : null;

    const specs: { label: string; value: string | null }[] = [
        { label: '상품 구성', value: detail?.prizeComposition ?? event.prizeName },
        {
            label: '추첨 인원',
            value: event.winnerCount === 1 ? '단 1명' : `${formatNumber(event.winnerCount)}명`,
        },
        { label: '배송 일정', value: detail?.shippingSchedule ?? null },
        {
            label: '모집 시각',
            value: `KST ${formatKst(event.startsAt, KST_HOUR_MINUTE)} 시작 · KST ${formatKst(event.endsAt, KST_HOUR_MINUTE)} 마감`,
        },
        { label: '멤버십 자격', value: detail?.membershipNote ?? null },
        {
            label: '1회 차감 수량',
            value:
                event.requiredTickets === 0
                    ? '응모권 없이 참여'
                    : `1회 응모 시 ${event.requiredTickets}장`,
        },
        { label: '보유 응모권', value: ticket ? `${formatNumber(ticket.balance)}장` : null },
        {
            label: '이번 이벤트 차감',
            value: `${formatNumber(entryCount * event.requiredTickets)}장`,
        },
        {
            label: '응모자 수',
            value:
                event.participantCount != null ? `${formatNumber(event.participantCount)}명` : null,
        },
        { label: '응모 건수', value: entryTotal != null ? `${formatNumber(entryTotal)}건` : null },
        {
            label: '총 차감 응모권',
            value:
                event.usedTicketCount != null ? `${formatNumber(event.usedTicketCount)}장` : null,
        },
    ];

    return (
        <section className="bg-surface-page border-border-default flex flex-col gap-6 rounded-2xl border p-5 sm:p-8">
            <h2 className="text-subhead text-fg-primary">이벤트 상세 안내</h2>

            <div className="flex flex-col gap-3">
                {paragraphs.map((paragraph) => (
                    <p key={paragraph} className="text-body text-fg-secondary">
                        {paragraph}
                    </p>
                ))}
            </div>

            <hr className="border-border-default" />

            <dl className="flex flex-col gap-3">
                {specs
                    .filter((spec) => spec.value != null)
                    .map(({ label, value }) => (
                        // 좁은 화면에서는 위아래로 쌓는다 — 라벨을 160px로 잡으면 값 칸이 90px대로 남는다
                        <div key={label} className="flex flex-col sm:flex-row sm:items-start">
                            <dt className="text-body-bold text-fg-primary sm:w-40 sm:shrink-0">
                                {label}
                            </dt>
                            <dd className="text-body-bold text-fg-primary min-w-0 sm:flex-1">
                                {value}
                            </dd>
                        </div>
                    ))}
            </dl>
        </section>
    );
}
