import { ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import type { Event } from '@entities/event';

import { KST_HOUR_MINUTE, formatKst } from '@shared/lib/date';
import { formatNumber } from '@shared/lib/format';
import { cn } from '@shared/lib/utils';
import { Button } from '@shared/ui/button';

import { kstDayLabel } from '../lib/raffleFormat';
import { RaffleThumbnail } from './RaffleThumbnail';

/** 접었을 때 보여 주는 줄 수 — 더 있으면 '지난 래플 전체보기'로 펼친다 */
const COLLAPSED_COUNT = 5;

interface ClosedRaffleListProps {
    events: Event[];
    now: Date;
}

export function ClosedRaffleList({ events, now }: ClosedRaffleListProps) {
    const [expanded, setExpanded] = useState(false);

    const visible = expanded ? events : events.slice(0, COLLAPSED_COUNT);

    // 날짜가 바뀌는 자리에만 '오늘 / 어제' 머리말을 넣는다
    const groups: { label: string; rows: Event[] }[] = [];
    for (const event of visible) {
        const label = kstDayLabel(event.endsAt, now);
        const last = groups.at(-1);
        if (last?.label === label) last.rows.push(event);
        else groups.push({ label, rows: [event] });
    }

    return (
        <section className="flex flex-col gap-5">
            <div className="flex items-center justify-between gap-4">
                <h2 className="text-title-3 text-fg-primary">마감한 래플</h2>
                {events.length > COLLAPSED_COUNT && (
                    <Button
                        variant="link"
                        size="text"
                        onClick={() => setExpanded((value) => !value)}
                        aria-expanded={expanded}
                    >
                        {expanded ? '접기' : '지난 래플 전체보기'}
                        <ChevronRight
                            className={cn('transition-transform', expanded && 'rotate-90')}
                        />
                    </Button>
                )}
            </div>

            {events.length === 0 ? (
                <p className="text-body-sm text-fg-tertiary">마감한 래플이 없어요.</p>
            ) : (
                <div className="flex flex-col">
                    {groups.map((group) => (
                        <div key={group.label} className="flex flex-col">
                            <p className="text-caption text-fg-tertiary px-5 pt-3.5 pb-0.5">
                                {group.label}
                            </p>
                            <ul className="divide-border-default flex flex-col divide-y">
                                {group.rows.map((event) => (
                                    <ClosedRaffleRow key={event.id} event={event} now={now} />
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}

function ClosedRaffleRow({ event, now }: { event: Event; now: Date }) {
    const isDrawn = event.status === 'drawn';
    // 발표 전에는 결과가 없다 — '결과 보기'로 적으면 열 수 없는 화면을 약속하게 된다
    const statusLabel =
        isDrawn || event.publicationScheduledAt == null
            ? '발표 완료'
            : `${formatKst(event.publicationScheduledAt, KST_HOUR_MINUTE)} 발표 예정`;

    const meta = [
        `${kstDayLabel(event.endsAt, now)} ${formatKst(event.endsAt, KST_HOUR_MINUTE)} 마감`,
        `당첨 ${formatNumber(event.winnerCount)}명`,
        event.participantCount != null ? `${formatNumber(event.participantCount)}명 참여` : null,
    ].filter(Boolean);

    return (
        <li className="flex items-center gap-4 p-4">
            <RaffleThumbnail
                src={event.bannerImageUrl}
                className="h-20 w-40 rounded-lg"
                fallbackIconClassName="size-6"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="text-caption text-fg-disabled">{statusLabel}</p>
                <p className="text-body-bold text-fg-primary truncate">{event.title}</p>
                <p className="text-caption text-fg-tertiary">{meta.join(' · ')}</p>
            </div>
            <Button asChild size="sm" className="shrink-0">
                <Link to={`/time-raffle/${event.id}`}>{isDrawn ? '결과 보기' : '상세 보기'}</Link>
            </Button>
        </li>
    );
}
