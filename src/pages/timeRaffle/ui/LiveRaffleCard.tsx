import { Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import type { Event } from '@entities/event';

import { useEntryStatistics } from '@entities/entry';
import { formatNumber } from '@shared/lib/format';
import { useVirtualClock } from '@shared/lib/virtualClock';
import { Button } from '@shared/ui/button';

import { formatCloseCountdown, formatRunningRange } from '../lib/raffleFormat';
import { RaffleThumbnail } from './RaffleThumbnail';

const CHIP = 'text-caption flex items-center rounded-full px-2.5 py-1';

interface LiveRaffleCardProps {
    event: Event;
}

export function LiveRaffleCard({ event }: LiveRaffleCardProps) {
    // 이 카드는 현재 보이는 진행 중 래플 1건이라 이 이벤트의 E03만 폴링한다 (ADR-0007)
    const { data: statistics, dataUpdatedAt } = useEntryStatistics(event.id, { isOpen: true });
    const { now } = useVirtualClock();
    // 마감까지 남은 시간은 가상 시계를, 받아온 지 얼마나 됐는지는 실제 시계를 본다.
    // updatedAt은 쿼리가 실제 시각으로 적는 값이라, 가상 시계로 시간을 옮기면
    // 섞어 뺀 값이 몇 시간 전으로 튄다
    const [ticks, setTicks] = useState(() => ({ virtual: now().getTime(), real: Date.now() }));

    useEffect(() => {
        const update = () => setTicks({ virtual: now().getTime(), real: Date.now() });
        // 가상 시계를 옮기면 now가 새로 내려오므로 다음 초를 기다리지 않고 바로 맞춘다
        update();
        const id = setInterval(update, 1000);
        return () => clearInterval(id);
    }, [now]);

    const remainingMs = new Date(event.endsAt).getTime() - ticks.virtual;
    // 참여 현황은 폴링으로 따라가는 값이라 지금 이 순간의 수가 아니다 — 언제 기준인지 같이 적는다
    const staleSeconds = Math.max(0, Math.floor((ticks.real - dataUpdatedAt) / 1000));

    const stats = [
        { label: '당첨 인원', value: `${formatNumber(event.winnerCount)}명` },
        {
            label: '참여 중',
            value: statistics ? `${formatNumber(statistics.participantCount)}명` : '-',
        },
        {
            label: '사용된 응모권',
            value: statistics ? `${formatNumber(statistics.totalSpentTicketCount)}장` : '-',
        },
    ];

    return (
        <article className="bg-surface-elevated border-border-default flex flex-col gap-8 rounded-2xl border py-6 pr-8 pl-6 shadow-md lg:flex-row lg:items-center">
            <RaffleThumbnail
                src={event.bannerImageUrl}
                className="h-56 w-full rounded-xl lg:h-72 lg:w-80"
                fallbackIconClassName="size-12"
            />

            <div className="flex min-w-0 flex-1 flex-col gap-3.5">
                <div className="flex flex-wrap items-center gap-2">
                    <span className={`${CHIP} bg-brand-primary text-fg-on-brand`}>진행중</span>
                    <span className={`${CHIP} bg-surface-sunken text-fg-primary gap-1`}>
                        <Clock className="size-3.5" />
                        {formatRunningRange(event)}
                    </span>
                    {remainingMs > 0 && (
                        <span
                            // 1초마다 바뀌는 값이라 읽어 주면 화면 낭독을 끊는다 — 남은 시간은 상세에서 다시 안내한다
                            aria-hidden
                            className={`${CHIP} bg-action-neutral text-fg-on-brand tabular-nums`}
                        >
                            마감까지 {formatCloseCountdown(remainingMs)}
                        </span>
                    )}
                </div>

                <div className="flex flex-col gap-1.5">
                    <h3 className="text-title-2 text-fg-primary">{event.title}</h3>
                    <p className="text-body-sm text-fg-secondary line-clamp-2">
                        {event.description}
                    </p>
                </div>

                <div className="flex flex-col gap-1.5">
                    <dl className="flex flex-col gap-2 sm:flex-row">
                        {stats.map(({ label, value }) => (
                            <div
                                key={label}
                                className="bg-surface-sunken flex flex-1 flex-col gap-0.5 rounded-xl px-4 py-3"
                            >
                                <dt className="text-caption text-fg-tertiary">{label}</dt>
                                <dd className="text-body-bold text-fg-primary">{value}</dd>
                            </div>
                        ))}
                    </dl>
                    {statistics && (
                        <p className="text-caption text-fg-tertiary">
                            참여 수는 {staleSeconds}초 전 기준이에요.
                        </p>
                    )}
                </div>

                <Button asChild variant="emphasis" size="lg" className="w-full">
                    <Link to={`/time-raffle/${event.id}`}>응모하러 가기</Link>
                </Button>
            </div>
        </article>
    );
}
