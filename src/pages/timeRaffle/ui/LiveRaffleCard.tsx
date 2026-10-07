import { Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import type { Event } from '@entities/event';

import { formatNumber } from '@shared/lib/format';
import { useVirtualClock } from '@shared/lib/virtualClock';
import { Button } from '@shared/ui/button';

import { formatCloseCountdown, formatRunningRange } from '../lib/raffleFormat';
import { RaffleThumbnail } from './RaffleThumbnail';

const CHIP = 'text-caption flex items-center rounded-full px-2.5 py-1';

interface LiveRaffleCardProps {
    event: Event;
    /** 목록을 마지막으로 받아온 시각 — 참여 수가 언제 기준인지 알린다 */
    updatedAt: number;
}

export function LiveRaffleCard({ event, updatedAt }: LiveRaffleCardProps) {
    const { now } = useVirtualClock();
    const [tick, setTick] = useState(() => now().getTime());

    useEffect(() => {
        const update = () => setTick(now().getTime());
        // 가상 시계를 옮기면 now가 새로 내려오므로 다음 초를 기다리지 않고 바로 맞춘다
        update();
        const id = setInterval(update, 1000);
        return () => clearInterval(id);
    }, [now]);

    const remainingMs = new Date(event.endsAt).getTime() - tick;
    // 참여 현황은 폴링으로 따라가는 값이라 지금 이 순간의 수가 아니다 — 언제 기준인지 같이 적는다
    const staleSeconds = Math.max(0, Math.floor((tick - updatedAt) / 1000));

    const stats = [
        { label: '당첨 인원', value: `${formatNumber(event.winnerCount)}명` },
        {
            label: '참여 중',
            value:
                event.participantCount != null ? `${formatNumber(event.participantCount)}명` : '-',
        },
        {
            label: '사용된 응모권',
            value: event.usedTicketCount != null ? `${formatNumber(event.usedTicketCount)}장` : '-',
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
                    <p className="text-caption text-fg-tertiary">
                        참여 수는 {staleSeconds}초 전 기준이에요.
                    </p>
                </div>

                <Button asChild variant="emphasis" size="lg" className="w-full">
                    <Link to={`/time-raffle/${event.id}`}>응모하러 가기</Link>
                </Button>
            </div>
        </article>
    );
}
