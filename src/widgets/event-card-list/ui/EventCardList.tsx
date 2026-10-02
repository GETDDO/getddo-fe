import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import type { Event } from '@entities/event';

import { EventCard } from '@entities/event';
import { cn } from '@shared/lib/utils';

export function EventCardList({
    title,
    moreHref,
    moreLabel = '전체보기',
    events,
    isPending,
    isError,
    emptyMessage = '표시할 이벤트가 없습니다.',
    twoRowsOnly = false,
}: {
    title: string;
    moreHref?: string;
    moreLabel?: string;
    events: Event[];
    isPending?: boolean;
    isError?: boolean;
    emptyMessage?: string;
    /** 화면 폭에 맞는 줄 수로 두 줄까지만 보여주고 나머지는 '더보기'로 넘긴다 (1열 2개 · 2열 4개 · 4열 8개) */
    twoRowsOnly?: boolean;
}) {
    return (
        <section className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h2 className="text-subhead text-fg-primary">{title}</h2>
                {moreHref && (
                    <Link
                        to={moreHref}
                        className="text-fg-primary text-body-sm flex items-center gap-0.5"
                    >
                        {moreLabel}
                        <ChevronRight className="size-5" />
                    </Link>
                )}
            </div>
            {isPending && <p className="text-fg-tertiary text-body-sm">불러오는 중…</p>}
            {isError && (
                <p className="text-destructive text-body-sm">이벤트 목록을 불러오지 못했습니다.</p>
            )}
            {!isPending && !isError && events.length === 0 && (
                <p className="text-fg-tertiary text-body-sm">{emptyMessage}</p>
            )}
            {events.length > 0 && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {events.map((event, index) => (
                        <Link
                            key={event.id}
                            to={`/events/${event.id}`}
                            className={cn(
                                'block',
                                twoRowsOnly && index >= 2 && 'max-sm:hidden',
                                twoRowsOnly && index >= 4 && 'sm:max-lg:hidden',
                                twoRowsOnly && index >= 8 && 'lg:hidden',
                            )}
                        >
                            <EventCard event={event} />
                        </Link>
                    ))}
                </div>
            )}
        </section>
    );
}
