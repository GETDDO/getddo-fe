import { ChevronRight, Gift } from 'lucide-react';
import { Link } from 'react-router-dom';

import { formatKst } from '@shared/lib/date';
import { cn } from '@shared/lib/utils';

import type { Event } from '../model/types';

const DATE_WITH_WEEKDAY: Intl.DateTimeFormatOptions = {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
};

/** '발표 내역·결과' 섹션의 가로형 행 — 마감(closed) 또는 추첨 완료(drawn) 이벤트를 나열한다 */
export function EventResultRow({ event }: { event: Event }) {
    const drawn = event.status === 'drawn';

    return (
        <Link
            to={`/events/${event.id}`}
            className="hover:bg-surface-sunken flex items-center gap-4 px-4 py-3 transition-colors"
        >
            {event.bannerImageUrl ? (
                <img
                    src={event.bannerImageUrl}
                    alt=""
                    className="size-14 shrink-0 rounded-lg object-cover"
                />
            ) : (
                <div className="bg-surface-sunken flex size-14 shrink-0 items-center justify-center rounded-lg">
                    <Gift className="text-fg-disabled size-6" />
                </div>
            )}
            <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-center gap-2">
                    <span
                        className={cn(
                            'text-caption rounded-sm px-2 py-0.5',
                            drawn
                                ? 'bg-brand-soft text-fg-brand'
                                : 'bg-surface-sunken text-fg-secondary',
                        )}
                    >
                        {drawn ? '추첨 완료' : '응모 마감'}
                    </span>
                </div>
                <p className="text-body-sm-bold text-fg-primary truncate">{event.title}</p>
                <p className="text-caption text-fg-tertiary">
                    {formatKst(event.startsAt, DATE_WITH_WEEKDAY)} ~{' '}
                    {formatKst(event.endsAt, DATE_WITH_WEEKDAY)}
                </p>
            </div>
            <ChevronRight className="text-fg-tertiary size-5 shrink-0" />
        </Link>
    );
}
