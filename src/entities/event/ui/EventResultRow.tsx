import { ChevronRight, Gift } from 'lucide-react';
import { Link } from 'react-router-dom';

import { toKst } from '@shared/lib/date';
import { StatusDot } from '@shared/ui/status-dot';

import type { Event } from '../model/types';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;

// 카드 표시용 "26.09.20(일)" 형태
function formatYmdWeekday(date: string): string {
    const d = toKst(date);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getUTCFullYear() % 100)}.${pad(d.getUTCMonth() + 1)}.${pad(d.getUTCDate())}(${WEEKDAYS[d.getUTCDay()]})`;
}

/** '발표 내역·결과' 섹션의 가로형 행 — 마감(closed) 또는 추첨 완료(drawn) 이벤트를 나열한다 */
export function EventResultRow({ event }: { event: Event }) {
    const drawn = event.status === 'drawn';

    return (
        <Link
            to={`/events/${event.id}`}
            // 호버하면 연한 배경이 생기되 행 끝까지 꽉 채우지 않고 사방으로 8px 들이고 옅게(60%) 그려 구분선·썸네일과 겹쳐 답답해 보이지 않게 한다 (after — before는 목록 구분선이 쓴다)
            className="group focus-visible:ring-border-focus after:bg-surface-canvas/60 relative isolate flex items-center gap-4 rounded-2xl p-4 after:absolute after:inset-x-2 after:inset-y-2 after:-z-10 after:rounded-xl after:opacity-0 hover:after:opacity-100 focus-visible:ring-2 focus-visible:outline-none motion-safe:after:transition-opacity motion-safe:after:duration-200"
        >
            {event.bannerImageUrl ? (
                <img
                    src={event.bannerImageUrl}
                    alt=""
                    className="h-20 w-40 shrink-0 rounded-lg object-cover"
                />
            ) : (
                <div className="bg-surface-canvas flex h-20 w-40 shrink-0 items-center justify-center rounded-lg">
                    <Gift className="text-fg-disabled size-8" />
                </div>
            )}
            <div className="flex min-w-0 flex-1 flex-col gap-1">
                <StatusDot tone={drawn ? 'muted' : 'brand'}>
                    {drawn ? '종료' : '응모 마감 · 발표 예정'}
                </StatusDot>
                <p className="text-title-3 text-fg-primary truncate">{event.title}</p>
                <p className="text-caption text-fg-tertiary">
                    {formatYmdWeekday(event.startsAt)} ~ {formatYmdWeekday(event.endsAt)}
                </p>
            </div>
            <ChevronRight className="text-fg-secondary group-hover:text-fg-primary size-7 shrink-0 motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:translate-x-1" />
        </Link>
    );
}
