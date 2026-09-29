import { Gift } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import type { Event } from '@entities/event';

import { formatKst, isSameKstDate } from '@shared/lib/date';
import { cn } from '@shared/lib/utils';
import { useVirtualClock } from '@shared/lib/virtual-clock';
import { Button } from '@shared/ui/button';

const TIME_ONLY: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
};

const MONTH_DAY: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' };

const CHIP = 'text-caption bg-surface-sunken text-fg-secondary rounded-full px-2.5 py-0.5';

export function TimeRaffleCard({ event }: { event: Event }) {
    // '오늘' 판정이 아니라 오픈 시각 표기 전용이므로 마운트 시각을 쓴다
    const clock = useVirtualClock();
    const [now] = useState(() => clock.now());

    const isOpen = event.status === 'open';
    const openTime = formatKst(event.startsAt, TIME_ONLY);
    const openDay = isSameKstDate(event.startsAt, now)
        ? '오늘'
        : formatKst(event.startsAt, MONTH_DAY);

    return (
        <article
            className={cn(
                'bg-surface-page flex h-55 gap-4 rounded-2xl border p-4 shadow-md',
                isOpen ? 'border-border-brand' : 'border-border-default',
            )}
        >
            <div className="bg-surface-canvas w-40 shrink-0 self-stretch overflow-hidden rounded-2xl">
                {event.bannerImageUrl ? (
                    <img src={event.bannerImageUrl} alt="" className="size-full object-contain" />
                ) : (
                    <div className="flex size-full items-center justify-center">
                        <Gift className="text-fg-disabled size-8" />
                    </div>
                )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                        {isOpen && (
                            <>
                                <span className="text-caption bg-brand-primary text-fg-on-brand rounded-full px-2.5 py-0.5">
                                    진행 중
                                </span>
                                <span className={CHIP}>오픈 {openTime}</span>
                            </>
                        )}
                        {event.status === 'upcoming' && (
                            <span className="text-caption text-fg-primary flex items-center gap-2">
                                <span className="bg-brand-primary size-1.25 rounded-full" />
                                {openDay} {openTime} 오픈 예정
                            </span>
                        )}
                        {(event.status === 'closed' || event.status === 'drawn') && (
                            <span className={CHIP}>오픈 {openTime}</span>
                        )}
                    </div>
                    <p className="text-title-3 text-fg-primary truncate">{event.title}</p>
                    <p className="text-body-sm text-fg-tertiary line-clamp-3">
                        {event.description}
                    </p>
                </div>

                {/* 마감·오픈 예정 래플은 디자인상 비활성 버튼으로 상태를 알린다 */}
                {isOpen ? (
                    <Button asChild variant="secondary" size="lg" className="w-full">
                        <Link to={`/time-raffle/${event.id}`}>
                            <span className="text-body-bold">응모하기</span>
                        </Link>
                    </Button>
                ) : (
                    <Button
                        disabled
                        size="lg"
                        className="bg-surface-disabled w-full disabled:opacity-100"
                    >
                        <span className="text-body-bold text-fg-disabled">
                            {event.status === 'upcoming' ? '오픈 예정' : '마감'}
                        </span>
                    </Button>
                )}
            </div>
        </article>
    );
}
