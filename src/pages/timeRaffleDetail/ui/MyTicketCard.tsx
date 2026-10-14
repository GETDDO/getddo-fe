import type { Event } from '@entities/event';

import { TICKET_GRADE_LABEL, ticketGradeSchema, useMyTickets } from '@entities/ticket';
import { formatNumber } from '@shared/lib/format';

export function MyTicketCard({ event }: { event: Event }) {
    const { data: ticket } = useMyTickets();

    const entryCount = event.myEntryCount ?? 0;
    // 한 번에 여러 장을 쓸 수 있어 횟수 × 차감량으로는 실제 사용량이 나오지 않는다
    const usedTickets = event.myTicketCount ?? entryCount * event.requiredTickets;
    const stats = [
        { label: '이번 래플 응모', value: `${formatNumber(entryCount)}회` },
        { label: '이번 래플에 쓴 응모권', value: `${formatNumber(usedTickets)}장` },
        {
            label: '보유 응모권',
            value: ticket ? `${formatNumber(ticket.availableCount)}장` : '-',
            // 등급 선택에 필요한 근거라 합계 아래에 등급별 장수를 작게 적는다
            hint: ticket
                ? ticketGradeSchema.options
                      .map((grade) => `${TICKET_GRADE_LABEL[grade]} ${ticket.countByGrade[grade]}`)
                      .join(' · ')
                : undefined,
        },
    ];

    return (
        <section className="bg-surface-page border-border-default flex flex-col gap-4 rounded-2xl border p-5">
            <h2 className="text-subhead text-fg-primary">내 응모권 현황</h2>
            {/* 넓은 화면 양 끝에 이름과 값이 떨어져 읽기 어렵던 표를 세 칸 요약으로 줄였다 */}
            <dl className="grid gap-3 sm:grid-cols-3">
                {stats.map(({ label, value, hint }) => (
                    <div
                        key={label}
                        className="bg-surface-sunken flex flex-col gap-0.5 rounded-xl px-4 py-3"
                    >
                        <dt className="text-caption text-fg-tertiary">{label}</dt>
                        <dd className="text-body-bold text-fg-primary tabular-nums">{value}</dd>
                        {hint && <dd className="text-caption text-fg-tertiary">{hint}</dd>}
                    </div>
                ))}
            </dl>
        </section>
    );
}
