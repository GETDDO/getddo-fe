import { Gift } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import type { Event } from '@entities/event';

import { formatYmd, kstDayDiff } from '../lib/event-period';

export function EventListCard({ event }: { event: Event }) {
    // pages에서는 app/virtual-clock을 참조할 수 없다 — 마감 판정이 아닌 D-day 표시 전용이므로 마운트 시각을 쓴다
    const [now] = useState(() => new Date());
    const dDay = event.status === 'open' ? kstDayDiff(event.endsAt, now) : null;
    const hasDDay = dDay != null && dDay >= 0;

    return (
        <Link
            to={`/events/${event.id}`}
            className="bg-surface-page flex h-70 flex-col overflow-hidden rounded-2xl shadow-md"
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
                            <span className="bg-brand-primary border-brand-primary text-surface-page text-caption rounded-full border px-3 py-0.5">
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
