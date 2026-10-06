import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import type { Event } from '@entities/event';

import { EventCard } from '@entities/event';
import { Button } from '@shared/ui/button';

export function EventCardList({
    title,
    moreHref,
    moreLabel = '더보기',
    events,
    isPending,
    isError,
    emptyMessage = '표시할 이벤트가 없습니다.',
}: {
    title: string;
    moreHref?: string;
    moreLabel?: string;
    events: Event[];
    isPending?: boolean;
    isError?: boolean;
    emptyMessage?: string;
}) {
    return (
        <section className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h2 className="text-title-3 text-fg-primary">{title}</h2>
                {moreHref && (
                    <Button asChild variant="link" size="text">
                        <Link to={moreHref}>
                            {moreLabel}
                            <ChevronRight />
                        </Link>
                    </Button>
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
                    {events.map((event) => (
                        <Link key={event.id} to={`/events/${event.id}`} className="block">
                            <EventCard event={event} />
                        </Link>
                    ))}
                </div>
            )}
        </section>
    );
}
