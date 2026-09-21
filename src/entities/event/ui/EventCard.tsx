import { Gift } from 'lucide-react';
import { useState } from 'react';

import { toKst } from '@shared/lib/date';
import { Card } from '@shared/ui/card';

import type { Event } from '../model/types';

const DAY_MS = 24 * 60 * 60 * 1000;

// 카드 표시용 "2026-09-01" 형태
function formatYmd(date: string): string {
    const d = toKst(date);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

// KST 달력 날짜 기준 D-day (마감 당일 = D-0)
function kstDayDiff(endIso: string, now: Date): number {
    const end = toKst(endIso);
    const n = toKst(now);
    const endDay = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
    const nowDay = Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate());
    return Math.round((endDay - nowDay) / DAY_MS);
}

export function EventCard({ event }: { event: Event }) {
    // FSD 경계상 app/virtual-clock은 entities에서 참조할 수 없다 — 마감 판정이 아닌 D-day 표시 전용이므로 마운트 시각을 쓴다
    const [now] = useState(() => new Date());
    const dDay = event.status === 'open' ? kstDayDiff(event.endsAt, now) : null;

    return (
        <Card className="h-full gap-0 py-0">
            {event.bannerImageUrl ? (
                <img
                    src={event.bannerImageUrl}
                    alt=""
                    className="aspect-[2/1] w-full object-cover"
                />
            ) : (
                <div className="bg-surface-sunken flex aspect-[2/1] items-center justify-center">
                    <Gift className="text-fg-disabled size-8" />
                </div>
            )}
            <div className="flex flex-col gap-2 p-4">
                {((event.tags?.length ?? 0) > 0 || (dDay != null && dDay >= 0)) && (
                    <div className="flex flex-wrap items-center gap-1.5">
                        {event.tags?.map((tag) => (
                            <span
                                key={tag}
                                className="border-border-default text-fg-secondary text-caption rounded-full border px-2 py-0.5"
                            >
                                {tag}
                            </span>
                        ))}
                        {dDay != null && dDay >= 0 && (
                            <span className="bg-brand-primary text-fg-on-brand text-caption rounded-full px-2 py-0.5">
                                D-{dDay}
                            </span>
                        )}
                    </div>
                )}
                <p className="text-subhead text-fg-primary">{event.title}</p>
                <p className="text-caption text-fg-tertiary">
                    {formatYmd(event.startsAt)} ~ {formatYmd(event.endsAt)}
                </p>
            </div>
        </Card>
    );
}
