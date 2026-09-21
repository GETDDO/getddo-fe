import { ChevronRight, Gift } from 'lucide-react';
import { Link } from 'react-router-dom';

import { toKst } from '@shared/lib/date';
import { cn } from '@shared/lib/utils';

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
            className="hover:bg-surface-sunken flex items-center gap-5 px-6 py-5 transition-colors"
        >
            {event.bannerImageUrl ? (
                <img
                    src={event.bannerImageUrl}
                    alt=""
                    className="size-24 shrink-0 rounded-lg object-cover"
                />
            ) : (
                <div className="bg-surface-sunken flex size-24 shrink-0 items-center justify-center rounded-lg">
                    <Gift className="text-fg-disabled size-8" />
                </div>
            )}
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span
                    className={cn(
                        'text-caption flex items-center gap-1.5',
                        drawn ? 'text-fg-tertiary' : 'text-fg-brand',
                    )}
                >
                    <span
                        aria-hidden="true"
                        className={cn(
                            'size-1.5 rounded-full',
                            drawn ? 'bg-fg-disabled' : 'bg-brand-primary',
                        )}
                    />
                    {drawn ? '종료' : '응모 마감 · 발표 예정'}
                </span>
                <p className="text-subhead text-fg-primary truncate">{event.title}</p>
                <p className="text-caption text-fg-tertiary">
                    {formatYmdWeekday(event.startsAt)} ~ {formatYmdWeekday(event.endsAt)}
                </p>
            </div>
            <ChevronRight className="text-fg-tertiary size-5 shrink-0" />
        </Link>
    );
}
