import { Gift } from 'lucide-react';
import { Link } from 'react-router-dom';

import { formatKst } from '@shared/lib/date';
import { StatusDot } from '@shared/ui/status-dot';

import type { Event } from '../model/types';

const TIME_ONLY: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: false,
};

/** 오픈 예정 이벤트 행 — 컨테이너 카드 안에 여러 개가 쌓이는 형태라 자체 카드 테두리는 두지 않는다 */
export function UpcomingEventCard({ event }: { event: Event }) {
    return (
        <Link
            to={`/events/${event.id}`}
            className="bg-surface-canvas hover:bg-surface-sunken flex min-h-0 flex-1 items-center gap-4 rounded-2xl p-4 transition-colors"
        >
            {event.bannerImageUrl ? (
                <img
                    src={event.bannerImageUrl}
                    alt=""
                    className="size-20 shrink-0 rounded-lg object-cover"
                />
            ) : (
                <div className="bg-surface-page flex size-20 shrink-0 items-center justify-center rounded-lg">
                    <Gift className="text-fg-disabled size-6" />
                </div>
            )}
            <div className="flex min-w-0 flex-col gap-1">
                <StatusDot tone="info">
                    오늘 {formatKst(event.startsAt, TIME_ONLY)} 오픈 예정
                </StatusDot>
                <p className="text-title-3 text-fg-primary truncate">
                    {event.title} ({event.winnerCount}명)
                </p>
                <p className="text-caption text-fg-tertiary">
                    응모권 {event.requiredTickets === 1 ? '1장' : '여러 장'} 응모 가능
                </p>
            </div>
        </Link>
    );
}
