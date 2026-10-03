import type { Event } from '@entities/event';

import { TimeRaffleCard } from './TimeRaffleCard';

interface TimeRaffleSectionProps {
    title: string;
    events: Event[];
    emptyMessage: string;
}

export function TimeRaffleSection({ title, events, emptyMessage }: TimeRaffleSectionProps) {
    return (
        <section className="flex flex-col gap-4">
            <h2 className="text-subhead text-fg-primary">{title}</h2>
            {events.length === 0 ? (
                <p className="text-body-sm text-fg-tertiary">{emptyMessage}</p>
            ) : (
                <div className="grid grid-cols-1 gap-x-4 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
                    {events.map((event) => (
                        <TimeRaffleCard key={event.id} event={event} />
                    ))}
                </div>
            )}
        </section>
    );
}
