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
            // 발표 결과 행과 같은 호버 — 행에서 8px 들인 옅은 배경, 안쪽 여백도 8px로 사방 같게
            className="focus-visible:ring-border-focus focus-visible:ring-offset-surface-page after:bg-surface-canvas/60 relative isolate flex min-h-0 items-center gap-4 rounded-2xl p-4 after:absolute after:inset-2 after:-z-10 after:rounded-xl after:opacity-0 hover:after:opacity-100 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none motion-safe:after:transition-opacity motion-safe:after:duration-200"
        >
            {event.bannerImageUrl ? (
                <img
                    src={event.bannerImageUrl}
                    alt=""
                    className="h-20 w-25 shrink-0 rounded-lg object-cover"
                />
            ) : (
                <div className="bg-surface-canvas flex h-20 w-25 shrink-0 items-center justify-center rounded-lg">
                    <Gift className="text-fg-disabled size-6" />
                </div>
            )}
            <div className="flex min-w-0 flex-col gap-1">
                <StatusDot tone="info">
                    오늘 {formatKst(event.startsAt, TIME_ONLY)} 오픈 예정
                </StatusDot>
                <p className="text-body-bold text-fg-primary truncate">
                    {event.title} <span className="text-fg-tertiary">({event.winnerCount}명)</span>
                </p>
                <p className="text-caption text-fg-tertiary">
                    응모권 {event.requiredTickets === 1 ? '1장' : '여러 장'} 응모 가능
                </p>
            </div>
        </Link>
    );
}
