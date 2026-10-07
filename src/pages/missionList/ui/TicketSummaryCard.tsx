import { ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { useTicketHistory, useTicketWallets } from '@entities/ticket';
import { formatNumber } from '@shared/lib/format';
import { useCountUp } from '@shared/lib/useCountUp';
import { useVirtualClock } from '@shared/lib/virtualClock';

import ticketCharacter from '../assets/ticket-character.png';
import { summarizeMonthlyTickets } from '../lib/monthlyTicketSummary';

/**
 * 응모권 요약 카드 — 피그마 미션 페이지 머리 오른쪽.
 * 응모권을 든 캐릭터, 사용 가능 응모권(크게), 이번 달 적립·사용, 적립·사용 내역 바로가기
 */
export function TicketSummaryCard() {
    const { data: wallets } = useTicketWallets();
    const { data: history } = useTicketHistory();
    // 이번 달 판정은 표시용이므로 마운트 시각을 쓴다
    const clock = useVirtualClock();
    const [now] = useState(() => clock.now());
    const monthly = history ? summarizeMonthlyTickets(history, now) : undefined;
    // 출석 등으로 응모권을 받으면 숫자가 굴러 올라간다
    const balance = useCountUp(wallets?.availableBalance);
    const format = (n: number | undefined) => (n == null ? '-' : formatNumber(n));

    return (
        <section
            aria-label="응모권 요약"
            className="bg-surface-elevated border-border-default flex shrink-0 items-center gap-4 rounded-2xl border py-3.5 pr-5 pl-4 shadow-md"
        >
            <img src={ticketCharacter} alt="" className="size-18 shrink-0 object-contain" />
            <div className="flex flex-col whitespace-nowrap">
                <span className="text-caption text-fg-tertiary">사용 가능 응모권</span>
                <span className="text-title-2 text-fg-primary tabular-nums">
                    {format(balance)}장
                </span>
                <span className="text-caption text-fg-tertiary">
                    이번 달 적립 {format(monthly?.earned)}장 · 사용 {format(monthly?.used)}장
                </span>
            </div>
            <span aria-hidden className="bg-border-default h-10 w-px shrink-0" />
            <Link
                to="/my-tickets"
                className="text-body-sm-bold text-fg-primary focus-visible:ring-border-focus focus-visible:ring-offset-surface-page flex shrink-0 items-center gap-0.5 rounded-sm whitespace-nowrap hover:underline focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
                적립·사용 내역
                <ChevronRight className="size-4" />
            </Link>
        </section>
    );
}
