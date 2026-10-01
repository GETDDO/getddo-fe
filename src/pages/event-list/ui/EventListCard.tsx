import { Gift } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import type { Event } from '@entities/event';

import { formatYmd, kstDayDiff } from '@shared/lib/date';
import { useVirtualClock } from '@shared/lib/virtual-clock';

export function EventListCard({ event }: { event: Event }) {
    // 마감 판정이 아닌 D-day 표시 전용이므로 마운트 시각을 쓴다
    const clock = useVirtualClock();
    const [now] = useState(() => clock.now());
    const dDay = event.status === 'open' ? kstDayDiff(event.endsAt, now) : null;
    const hasDDay = dDay != null && dDay >= 0;

    // 카드 배경이 페이지 배경과 같은 토큰이라 그림자만으로는 경계가 생기지 않는다.
    // 다크에서는 그 그림자마저 어두운 배경에 묻혀 카드가 통째로 사라져 보이므로 테두리를 둔다.
    return (
        <Link
            to={`/events/${event.id}`}
            className="bg-surface-page border-border-default flex h-70 flex-col overflow-hidden rounded-2xl border shadow-md"
        >
            {event.bannerImageUrl ? (
                <img src={event.bannerImageUrl} alt="" className="h-37.5 w-full object-cover" />
            ) : (
                <div className="bg-surface-sunken flex h-37.5 items-center justify-center">
                    <Gift className="text-fg-disabled size-8" />
                </div>
            )}
            <div className="flex flex-col gap-3 p-3.5">
                {((event.tags?.length ?? 0) > 0 || hasDDay) && (
                    <div className="flex flex-wrap items-center gap-2">
                        {event.tags?.map((tag) => (
                            <span
                                key={tag}
                                className="bg-status-active border-status-active-text text-status-active-text text-caption rounded-full border px-3 py-0.5"
                            >
                                {tag}
                            </span>
                        ))}
                        {hasDDay && (
                            <span className="bg-brand-primary border-brand-primary text-fg-on-brand text-caption rounded-full border px-3 py-0.5">
                                D-{dDay}
                            </span>
                        )}
                    </div>
                )}
                <div className="flex flex-col gap-2">
                    <p className="text-title-3 text-fg-primary truncate">{event.title}</p>
                    <p className="text-body text-fg-tertiary">
                        {formatYmd(event.startsAt)} ~ {formatYmd(event.endsAt)}
                    </p>
                </div>
            </div>
        </Link>
    );
}
