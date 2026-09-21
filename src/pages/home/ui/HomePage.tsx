import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import { EventResultRow, useEventList } from '@entities/event';
import { BannerSlider } from '@widgets/banner-slider';
import { EventCardList } from '@widgets/event-card-list';
import { LiveEntryStatus } from '@widgets/live-entry-status';
import { TicketBalanceWidget } from '@widgets/ticket-balance-widget';
import { TicketEventSection } from '@widgets/ticket-event-section';

export function HomePage() {
    const { data: events, isPending, isError } = useEventList();

    const ticketEvents = (events ?? []).filter((event) => event.requiredTickets > 0);
    const freeEvents = (events ?? []).filter((event) => event.requiredTickets === 0);
    const resultEvents = (events ?? []).filter(
        (event) => event.status === 'closed' || event.status === 'drawn',
    );

    return (
        <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-12 px-6 py-10">
            <BannerSlider renderStatus={(event) => <LiveEntryStatus event={event} />} />
            <TicketEventSection events={ticketEvents} isPending={isPending} isError={isError} />
            <TicketBalanceWidget />
            <EventCardList
                title="응모권 없이 참여할 수 있는 이벤트"
                moreHref="/events"
                moreLabel="전체보기"
                events={freeEvents}
                isPending={isPending}
                isError={isError}
                emptyMessage="현재 응모권 없이 참여할 수 있는 이벤트가 없습니다."
            />
            {resultEvents.length > 0 && (
                <section className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-subhead text-fg-primary">발표 내역·결과</h2>
                        <Link
                            to="/events"
                            className="text-fg-primary text-body-sm flex items-center gap-0.5"
                        >
                            전체보기
                            <ChevronRight className="size-5" />
                        </Link>
                    </div>
                    <div className="border-border-default divide-border-default flex flex-col divide-y rounded-2xl border">
                        {resultEvents.map((event) => (
                            <EventResultRow key={event.id} event={event} />
                        ))}
                    </div>
                </section>
            )}
        </main>
    );
}
