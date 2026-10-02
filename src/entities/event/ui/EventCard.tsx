import { Gift } from 'lucide-react';
import { useState } from 'react';

import { toKst } from '@shared/lib/date';
import { useVirtualClock } from '@shared/lib/virtual-clock';
import { Badge } from '@shared/ui/badge';
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
    // 마감 판정이 아닌 D-day 표시 전용이므로 마운트 시각을 쓴다
    const clock = useVirtualClock();
    const [now] = useState(() => clock.now());
    const dDay = event.status === 'open' ? kstDayDiff(event.endsAt, now) : null;

    return (
        // 피그마 홈 이벤트 카드 — 테두리 없이 그림자, 이미지 높이 150, 본문 여백 16
        <Card variant="elevated" className="h-full gap-0 py-0">
            {event.bannerImageUrl ? (
                <img src={event.bannerImageUrl} alt="" className="h-37.5 w-full object-cover" />
            ) : (
                <div className="bg-surface-sunken flex h-37.5 items-center justify-center">
                    <Gift className="text-fg-disabled size-8" />
                </div>
            )}
            <div className="flex flex-col gap-3 p-4">
                {((event.tags?.length ?? 0) > 0 || (dDay != null && dDay >= 0)) && (
                    <div className="flex flex-wrap items-center gap-2">
                        {event.tags?.map((tag) => (
                            <Badge key={tag} variant="info">
                                {tag}
                            </Badge>
                        ))}
                        {dDay != null && dDay >= 0 && <Badge variant="brand">D-{dDay}</Badge>}
                    </div>
                )}
                <div className="flex flex-col gap-2">
                    <p className="text-title-3 text-fg-primary truncate">{event.title}</p>
                    <p className="text-body text-fg-tertiary">
                        {formatYmd(event.startsAt)} ~ {formatYmd(event.endsAt)}
                    </p>
                </div>
            </div>
        </Card>
    );
}
