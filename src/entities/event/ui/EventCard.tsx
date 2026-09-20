import { formatKst } from '@shared/lib/date';
import { cn } from '@shared/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/card';

import type { Event } from '../model/types';

const STATUS_LABEL: Record<Event['status'], string> = {
    upcoming: '오픈 예정',
    open: '응모 가능',
    closed: '마감',
    drawn: '추첨 완료',
};

export function EventCard({ event }: { event: Event }) {
    return (
        <Card>
            <CardHeader className="flex-row items-center justify-between">
                <CardTitle>{event.title}</CardTitle>
                <span
                    className={cn(
                        'text-caption rounded-sm px-2 py-0.5',
                        event.status === 'open'
                            ? 'bg-brand-soft text-fg-brand'
                            : 'bg-surface-sunken text-fg-secondary',
                    )}
                >
                    {STATUS_LABEL[event.status]}
                </span>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground text-sm">{event.description}</p>
                <p className="mt-2 text-sm">
                    {formatKst(event.startsAt, { month: 'numeric', day: 'numeric' })} ~{' '}
                    {formatKst(event.endsAt, { month: 'numeric', day: 'numeric' })} · 응모권{' '}
                    {event.requiredTickets}장 · {event.winnerCount}명 추첨
                </p>
            </CardContent>
        </Card>
    );
}
